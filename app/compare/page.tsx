'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { DESTINATIONS, findDestination } from '@/lib/destinations';
import { generateTransportOptions } from '@/lib/cost-engine';
import type { TransportOption } from '@/lib/types';
import Footer from '@/components/Footer';
import {
  GitCompare,
  Plane,
  Train,
  Car,
  Bus,
  Clock,
  TrendingDown,
  Zap,
  Award,
  Users,
  MapPin,
  HelpCircle,
  ShieldCheck,
  Fuel,
  Receipt,
  ArrowRight,
} from 'lucide-react';

const OpenStreetMapView = dynamic(() => import('@/components/OpenStreetMapView'), { ssr: false });

// One-way road/air distance estimates from India, used for the live transit budget.
// Keeping these keyed by destination prevents every domestic destination from being
// priced as the Goa route.
const ROUTE_DISTANCES_KM: Record<string, number> = {
  goa_in: 1200,
  manali_in: 560,
  jaisalmer_in: 780,
  rishikesh_in: 260,
  varanasi_in: 820,
  darjeeling_in: 1500,
  bangkok_th: 3000,
  phuket_th: 3200,
  dubai_ae: 2200,
  kathmandu_np: 820,
  colombo_lk: 2400,
  maldives_mv: 2000,
  bali_id: 4500,
  singapore_sg: 4200,
  kuala_lumpur_my: 4100,
  tokyo_jp: 5800,
  paris_fr: 7200,
};

const ORIGIN_SUGGESTIONS = [
  'New Delhi (DEL)', 'Mumbai (BOM)', 'Bengaluru (BLR)', 'Hyderabad (HYD)',
  'Chennai (MAA)', 'Kolkata (CCU)', 'Pune (PNQ)', 'Jaipur (JAI)', 'Kochi (COK)',
];

function getRouteDistance(destinationId: string, isInternational: boolean) {
  return ROUTE_DISTANCES_KM[destinationId] ?? (isInternational ? 3500 : 900);
}

function CompareContent() {
  const searchParams = useSearchParams();
  const initialDestSlug = searchParams.get('dest') || 'goa-india';
  const initialTravelers = parseInt(searchParams.get('travelers') || '4', 10);

  const initialDestination = findDestination(initialDestSlug) ?? DESTINATIONS[0];
  const [origin, setOrigin] = useState('New Delhi (DEL)');
  // Store the catalog ID, not a URL label. This makes the selected option and
  // every calculation use the same destination record.
  const [destinationId, setDestinationId] = useState(initialDestination.id);
  const [destinationInput, setDestinationInput] = useState(
    `${initialDestination.city}, ${initialDestination.country}`
  );
  const [travelers, setTravelers] = useState(initialTravelers);
  const [loading, setLoading] = useState(false);
  const [roadError, setRoadError] = useState<string | null>(null);

  const destination = DESTINATIONS.find((item) => item.id === destinationId) ?? initialDestination;
  const isInternational = destination.countryCode !== 'IN';
  const distanceKm = getRouteDistance(destination.id, isInternational);

  const [options, setOptions] = useState<TransportOption[]>([]);

  const selectDestination = (value: string) => {
    setDestinationInput(value);
    const matchedDestination = findDestination(value);
    if (matchedDestination) setDestinationId(matchedDestination.id);
  };

  useEffect(() => {
    let cancelled = false;
    const fallbackOptions = generateTransportOptions(
      distanceKm,
      travelers,
      isInternational,
      'IN',
      destination.countryCode
    );
    const nonRoadOptions = fallbackOptions.filter((option) => option.mode !== 'CAR' && option.mode !== 'BIKE');
    setOptions(nonRoadOptions);
    setRoadError(null);

    const loadLiveRoadOptions = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/routes/road', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin,
            destination: `${destination.city}, ${destination.country}`,
            travelers,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Live road data is unavailable.');
        if (cancelled) return;

        setOptions([...nonRoadOptions, ...data.options].sort((a, b) => a.totalCost - b.totalCost));
      } catch (error) {
        if (!cancelled) {
          setRoadError(error instanceof Error ? error.message : 'Live road data is unavailable.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = window.setTimeout(loadLiveRoadOptions, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [origin, destinationId, destination.city, destination.country, destination.countryCode, travelers, distanceKm, isInternational]);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'AIR':
        return Plane;
      case 'RAIL':
        return Train;
      case 'CAR':
        return Car;
      case 'BUS':
        return Bus;
      default:
        return Plane;
    }
  };

  const getBadgeConfig = (opt: TransportOption) => {
    if (opt.isCheapest) {
      return {
        label: 'Cheapest Option',
        icon: TrendingDown,
        classes: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      };
    }
    if (opt.isFastest) {
      return {
        label: 'Fastest Transit',
        icon: Zap,
        classes: 'bg-[#D4B896]/10 text-[#D4B896] border-[#D4B896]/30',
      };
    }
    if (opt.isBestValue) {
      return {
        label: 'Best Value',
        icon: Award,
        classes: 'bg-red-500/10 text-red-300 border-red-500/30',
      };
    }
    return null;
  };

  // Road math uses the live OpenStreetMap/OSRM route.
  const carRoad = options.find((option) => option.mode === 'CAR')?.roadBreakdown;
  const fuelRate = carRoad?.fuelPricePerLiter ?? 105;
  const carMileage = carRoad?.mileageKmPerLiter ?? 15;
  const roundtripDist = carRoad?.roundTripDistanceKm ?? distanceKm * 2;
  const estimatedFuel = carRoad?.fuelCost ?? Math.round((roundtripDist / carMileage) * fuelRate);
  const estimatedTolls = carRoad?.tollEstimate ?? 0;
  const totalRoadCost = estimatedFuel + estimatedTolls;
  const roadPerPerson = Math.round(totalRoadCost / travelers);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5E6D3]">
      {/* Header Banner */}
      <div className="border-b border-[#F5E6D3]/[0.08] bg-[#0E0E0E] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
            <GitCompare className="w-4 h-4" />
            Multi-Modal Transit Intelligence
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-['Outfit'] text-[#F5E6D3]">
            Route & Transit Comparison
          </h1>
          <p className="text-xs sm:text-sm text-[#A89070] max-w-2xl mt-1 leading-relaxed">
            Side-by-side economics for air, rail, road, and bus transit. Factor door-to-door
            travel time, fuel + tolls formulas, and group cost splitting.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Controls Bar */}
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#F5E6D3]/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-[#A89070] block mb-1.5">
              Origin City
            </label>
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              list="origin-suggestions"
              placeholder="Type your departure city"
              className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3] font-semibold focus:outline-none focus:border-red-500"
            />
            <datalist id="origin-suggestions">
              {ORIGIN_SUGGESTIONS.map((city) => <option key={city} value={city} />)}
            </datalist>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A89070] block mb-1.5">
              Destination
            </label>
            <input
              value={destinationInput}
              onChange={(e) => selectDestination(e.target.value)}
              list="destination-suggestions"
              placeholder="Type a city or country"
              className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3] font-semibold focus:outline-none focus:border-red-500"
            />
            <datalist id="destination-suggestions">
              {DESTINATIONS.map((d) => (
                <option key={d.id} value={`${d.city}, ${d.country}`}>
                  {d.city}, {d.country} {d.countryCode !== 'IN' ? '✈️ (Intl)' : ''}
                </option>
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A89070] block mb-1.5">
              Travelers ({travelers} pax)
            </label>
            <div className="flex items-center justify-between bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl p-1">
              {[2, 4, 6, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setTravelers(n)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                    travelers === n
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-[#A89070] hover:text-[#F5E6D3]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-modal Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-['Outfit'] text-[#F5E6D3] flex items-center gap-2">
              Transit Options for {destination.city}
              <span className="text-xs font-normal text-[#A89070]">
                (~{distanceKm} km one-way)
              </span>
            </h2>
            <Link
              href={`/destination/${destination.slug}`}
              className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              View Full {destination.city} Budget
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading && (
            <p className="text-xs text-[#D4B896] animate-pulse">Loading live OpenStreetMap road route…</p>
          )}
          {roadError && (
            <p className="text-xs text-[#A89070]">
              Live OpenStreetMap routing is unavailable. Road costs are withheld instead of showing a fabricated estimate.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {options.map((opt, idx) => {
              const Icon = getModeIcon(opt.mode);
              const badge = getBadgeConfig(opt);
              const hours = Math.floor(opt.durationMinutes / 60);
              const mins = opt.durationMinutes % 60;

              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#141414] border border-[#F5E6D3]/[0.08] hover:border-red-500/40 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group shadow-lg"
                >
                  {badge && (
                    <div
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border self-start ${badge.classes}`}
                    >
                      <badge.icon className="w-3 h-3" />
                      {badge.label}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#F5E6D3]/[0.04] border border-[#F5E6D3]/[0.08] flex items-center justify-center text-[#D4B896] group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#F5E6D3]">{opt.mode}</h3>
                      <div className="text-xs text-[#A89070] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#A89070]" />
                        {hours}h {mins > 0 ? `${mins}m` : ''} door-to-door
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F5E6D3]/[0.02] border border-[#F5E6D3]/[0.04] space-y-1">
                    <div className="text-xs text-[#A89070]">Cost Per Person</div>
                    <div className="text-2xl font-black font-mono text-[#F5E6D3]">
                      ₹{opt.costPerPerson.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-[#A89070] font-mono">
                      ₹{opt.totalCost.toLocaleString('en-IN')} total group
                    </div>
                  </div>

                  <p className="text-xs text-[#A89070] leading-relaxed">{opt.details}</p>

                  <div className="pt-2 border-t border-[#F5E6D3]/[0.06] text-[11px] text-red-400 font-medium">
                    {opt.dataQuality === 'LIVE' ? 'Live OpenStreetMap/OSRM route data' : 'Modeled estimate'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Road Cost Formula Transparency Section */}
        {!isInternational && carRoad && (
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#F5E6D3]/[0.08] shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5E6D3]/[0.08]">
              <div>
                <h3 className="text-base font-bold font-['Outfit'] text-[#F5E6D3] flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-[#D4B896]" />
                  Road Trip Mathematical Proof Engine
                </h3>
                <p className="text-xs text-[#A89070]">
                  Live OpenStreetMap route for {origin} → {destination.city}, with round-trip fuel calculation
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#D4B896]/10 text-[#D4B896] border border-[#D4B896]/20">
                PRD Section 6.2 Formula
              </span>
            </div>

            {carRoad.routeCoordinates && carRoad.routeCoordinates.length > 1 && (
              <OpenStreetMapView
                route={carRoad.routeCoordinates}
                points={[
                  {
                    latitude: carRoad.routeCoordinates[0][0],
                    longitude: carRoad.routeCoordinates[0][1],
                    label: origin,
                  },
                  {
                    latitude: carRoad.routeCoordinates[carRoad.routeCoordinates.length - 1][0],
                    longitude: carRoad.routeCoordinates[carRoad.routeCoordinates.length - 1][1],
                    label: destination.city,
                  },
                ]}
                className="h-80"
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F5E6D3]/[0.02] border border-[#F5E6D3]/[0.04] space-y-1.5">
                <div className="text-xs text-[#A89070] flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-[#D4B896]" />
                  Fuel Estimation
                </div>
                <div className="text-xl font-bold font-mono text-[#F5E6D3]">
                  ₹{estimatedFuel.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-[#A89070]">
                  {roundtripDist.toLocaleString('en-IN')} km round-trip @ {carMileage} km/L × ₹{fuelRate}/L
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F5E6D3]/[0.02] border border-[#F5E6D3]/[0.04] space-y-1.5">
                <div className="text-xs text-[#A89070] flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-red-400" />
                  FASTag Toll Tariffs
                </div>
                <div className="text-xl font-bold font-mono text-[#F5E6D3]">
                  ₹{estimatedTolls.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-[#A89070]">
                  Toll pricing is not provided by OpenStreetMap/OSRM
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F5E6D3]/[0.02] border border-[#F5E6D3]/[0.04] space-y-1.5">
                <div className="text-xs text-[#A89070] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-red-400" />
                  Group Cost Split
                </div>
                <div className="text-xl font-bold font-mono text-[#F5E6D3]">
                  ₹{roadPerPerson.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-[#A89070]">/ person</span>
                </div>
                <div className="text-[11px] text-[#A89070]">
                  Total ₹{totalRoadCost.toLocaleString('en-IN')} split {travelers} ways
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#F5E6D3]/[0.06] text-xs text-[#A89070] leading-relaxed">
              <strong className="text-[#E8D5BD]">The Road Trip Advantage:</strong> Unlike flights or
              trains where costs scale linearly per passenger (1x, 2x, 4x, 6x), a shared road trip
              fixed cost (fuel + tolls) is divided equally. For a group of {travelers} friends, driving
              yields a transit cost of only{' '}
              <strong className="text-red-300 font-mono">
                ₹{roadPerPerson.toLocaleString('en-IN')}
              </strong>{' '}
              per traveler!
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-[#A89070] text-sm">
          Loading route comparison...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
