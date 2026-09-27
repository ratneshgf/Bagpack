'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { DESTINATIONS, findDestination } from '@/lib/destinations';
import type { TransportOption } from '@/lib/types';
import type { ProviderStatus } from '@/lib/live-transport';
import Footer from '@/components/Footer';
import LocationAutocomplete from '@/components/LocationAutocomplete';
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
  Fuel,
  Receipt,
  ArrowRight,
  Bookmark,
  ExternalLink,
} from 'lucide-react';

const OpenStreetMapView = dynamic(() => import('@/components/OpenStreetMapView'), { ssr: false });

function CompareContent() {
  const searchParams = useSearchParams();
  const initialDestSlug = searchParams.get('dest') || 'goa-india';
  const initialTravelers = parseInt(searchParams.get('travelers') || '4', 10);

  const initialDestination = findDestination(initialDestSlug) ?? DESTINATIONS[0];
  const [origin, setOrigin] = useState('New Delhi (DEL)');
  const [destinationInput, setDestinationInput] = useState(
    `${initialDestination.city}, ${initialDestination.country}`
  );
  const [travelers, setTravelers] = useState(initialTravelers);
  const [departureDate, setDepartureDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [carMileageKmPerLiter, setCarMileageKmPerLiter] = useState(15);
  const [bikeMileageKmPerLiter, setBikeMileageKmPerLiter] = useState(45);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(105);
  const [tripDays, setTripDays] = useState(4);
  const [hotelNightPerRoom, setHotelNightPerRoom] = useState(2500);
  const [foodPerPersonPerDay, setFoodPerPersonPerDay] = useState(700);
  const [activitiesPerPersonPerDay, setActivitiesPerPersonPerDay] = useState(500);
  const [localTravelPerDay, setLocalTravelPerDay] = useState(800);
  const [selectedTransportMode, setSelectedTransportMode] = useState<'CAR' | 'BIKE' | 'AIR' | 'TRAIN' | 'BUS'>('CAR');
  const [airFarePerPerson, setAirFarePerPerson] = useState(0);
  const [trainFarePerPerson, setTrainFarePerPerson] = useState(0);
  const [busFarePerPerson, setBusFarePerPerson] = useState(0);
  const [loading, setLoading] = useState(false);
  const [roadError, setRoadError] = useState<string | null>(null);
  const [savingTrip, setSavingTrip] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [, setProviders] = useState<ProviderStatus | null>(null);

  const catalogDestination = findDestination(destinationInput);
  const [options, setOptions] = useState<TransportOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadLiveRoadOptions = async () => {
      setOptions([]);
      setRoadError(null);
      setLoading(true);
      try {
        const response = await fetch('/api/routes/road', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin,
            destination: destinationInput,
            travelers,
            departureDate,
            carMileageKmPerLiter,
            bikeMileageKmPerLiter,
            fuelPricePerLiter,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Live road data is unavailable.');
        if (cancelled) return;

        setOptions(data.options);
        setProviders(data.providers ?? null);
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
  }, [origin, destinationInput, travelers, departureDate, carMileageKmPerLiter, bikeMileageKmPerLiter, fuelPricePerLiter]);

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

  const carRoad = options.find((option) => option.mode === 'CAR')?.roadBreakdown;
  const fuelRate = carRoad?.fuelPricePerLiter;
  const carMileage = carRoad?.mileageKmPerLiter;
  const roundtripDist = carRoad?.roundTripDistanceKm;
  const estimatedFuel = carRoad?.fuelCost;
  const estimatedTolls = carRoad?.tollEstimate;
  const tollsAvailable = carRoad?.tollSource !== 'UNAVAILABLE';
  const totalRoadCost = estimatedFuel !== undefined && estimatedTolls !== undefined ? estimatedFuel + (tollsAvailable ? estimatedTolls : 0) : undefined;
  const roadPerPerson = totalRoadCost !== undefined ? Math.round(totalRoadCost / travelers) : undefined;
  const selectedRoadOption = options.find((option) => option.mode === selectedTransportMode);
  const selectedTransportTotal = selectedTransportMode === 'AIR'
    ? airFarePerPerson * travelers
    : selectedTransportMode === 'TRAIN'
      ? trainFarePerPerson * travelers
      : selectedTransportMode === 'BUS'
        ? busFarePerPerson * travelers
        : selectedRoadOption?.totalCost ?? 0;
  const selectedTransportReady = selectedTransportMode === 'CAR' || selectedTransportMode === 'BIKE'
    ? Boolean(selectedRoadOption)
    : selectedTransportMode === 'AIR'
      ? airFarePerPerson > 0
      : selectedTransportMode === 'TRAIN'
        ? trainFarePerPerson > 0
        : busFarePerPerson > 0;
  const tripTotal = useMemo(() => {
    const nights = Math.max(tripDays - 1, 1);
    const rooms = Math.ceil(travelers / 2);
    const transport = selectedTransportTotal;
    const stay = hotelNightPerRoom * rooms * nights;
    const food = foodPerPersonPerDay * travelers * tripDays;
    const activities = activitiesPerPersonPerDay * travelers * tripDays;
    const localTravel = localTravelPerDay * tripDays;
    return { nights, rooms, transport, stay, food, activities, localTravel, total: transport + stay + food + activities + localTravel };
  }, [selectedTransportTotal, tripDays, travelers, hotelNightPerRoom, foodPerPersonPerDay, activitiesPerPersonPerDay, localTravelPerDay]);
  const convenience = carRoad?.distanceKm
    ? carRoad.distanceKm > 1200 ? 'This is a long road journey. Flight is usually the most convenient option; use the live flight search card below.'
      : carRoad.distanceKm > 500 ? 'For this distance, compare car fuel cost with train or flight before deciding.'
      : 'This is a practical road-trip distance. Car is likely convenient for a group and luggage.'
    : 'Enter origin and destination to get a route-based convenience recommendation.';
  const transportChoices = [
    { mode: 'CAR' as const, label: 'Car', total: options.find((option) => option.mode === 'CAR')?.totalCost, note: 'Live road route + fuel' },
    { mode: 'BIKE' as const, label: 'Bike', total: options.find((option) => option.mode === 'BIKE')?.totalCost, note: 'Live road route + fuel' },
    { mode: 'TRAIN' as const, label: 'Train', total: trainFarePerPerson > 0 ? trainFarePerPerson * travelers : undefined, note: 'Enter IRCTC return fare' },
    { mode: 'BUS' as const, label: 'Bus', total: busFarePerPerson > 0 ? busFarePerPerson * travelers : undefined, note: 'Enter redBus return fare' },
    { mode: 'AIR' as const, label: 'Flight', total: airFarePerPerson > 0 ? airFarePerPerson * travelers : undefined, note: 'Enter Google Flights return fare' },
  ];

  const saveTrip = async () => {
    if (!selectedTransportReady) {
      setSaveMessage(`Add the verified return ${selectedTransportMode.toLowerCase()} fare, or wait for the road route, before saving.`);
      return;
    }

    setSavingTrip(true);
    setSaveMessage(null);
    const [city = destinationInput, country = 'India'] = destinationInput.split(',').map((part) => part.trim());
    const slug = catalogDestination?.slug ?? `custom-${destinationInput.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80)}`;
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${city} ${tripDays}-day trip`,
          destinationSlug: slug,
          destinationCity: city,
          destinationCountry: country,
          origin,
          travelers,
          durationDays: tripDays,
          estimatedCostPerPerson: Math.round(tripTotal.total / travelers),
          totalGroupCost: Math.round(tripTotal.total),
          travelStyle: 'CUSTOM',
          selectedTransportMode,
          breakdown: {
            transport: Math.round(tripTotal.transport),
            stay: Math.round(tripTotal.stay),
            food: Math.round(tripTotal.food),
            activities: Math.round(tripTotal.activities),
            localTravel: Math.round(tripTotal.localTravel),
            nights: tripTotal.nights,
            rooms: tripTotal.rooms,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save your trip.');
      setSaveMessage('Trip saved. Open Saved Trips to view the full breakdown.');
    } catch (saveError) {
      setSaveMessage(saveError instanceof Error ? saveError.message : 'Unable to save your trip.');
    } finally {
      setSavingTrip(false);
    }
  };

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
            <LocationAutocomplete
              value={origin}
              onChange={setOrigin}
              type="ORIGIN"
              placeholder="Type any departure place worldwide"
              className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3] font-semibold focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#A89070] block mb-1.5">
              Destination
            </label>
            <LocationAutocomplete
              value={destinationInput}
              onChange={setDestinationInput}
              type="DESTINATION"
              placeholder="Type any city, village, island or hidden place"
              className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3] font-semibold focus:outline-none focus:border-red-500"
            />
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
          <div>
            <label className="text-xs font-medium text-[#A89070] block mb-1.5">Departure date</label>
            <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#A89070] block mb-1.5">Your car mileage (km/L)</label>
            <input type="number" min="1" step="0.1" value={carMileageKmPerLiter} onChange={(e) => setCarMileageKmPerLiter(Number(e.target.value))} className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#A89070] block mb-1.5">Your bike mileage (km/L)</label>
            <input type="number" min="1" step="0.1" value={bikeMileageKmPerLiter} onChange={(e) => setBikeMileageKmPerLiter(Number(e.target.value))} className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#A89070] block mb-1.5">Current fuel price (₹/L)</label>
            <input type="number" min="1" step="0.1" value={fuelPricePerLiter} onChange={(e) => setFuelPricePerLiter(Number(e.target.value))} className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" />
          </div>
          <div><label className="text-xs font-medium text-[#A89070] block mb-1.5">Trip days</label><input type="number" min="2" max="30" value={tripDays} onChange={(e) => setTripDays(Number(e.target.value))} className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" /></div>
          <div><label className="flex items-center justify-between gap-2 text-xs font-medium text-[#A89070] mb-1.5"><span>Stay quote (₹ / room / night)</span><a href="https://www.makemytrip.com/hotels/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-red-400 hover:text-red-300">Check live hotels <ExternalLink className="h-3 w-3" /></a></label><input type="number" min="0" value={hotelNightPerRoom} onChange={(e) => setHotelNightPerRoom(Number(e.target.value))} className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" /><p className="mt-1 text-[10px] text-[#A89070]">Search {destinationInput}, select dates, then enter the live room rate here.</p></div>
          <div><label className="text-xs font-medium text-[#A89070] block mb-1.5">Food (₹ / person / day)</label><input type="number" min="0" value={foodPerPersonPerDay} onChange={(e) => setFoodPerPersonPerDay(Number(e.target.value))} className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" /></div>
          <div><label className="text-xs font-medium text-[#A89070] block mb-1.5">Activities (₹ / person / day)</label><input type="number" min="0" value={activitiesPerPersonPerDay} onChange={(e) => setActivitiesPerPersonPerDay(Number(e.target.value))} className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" /></div>
          <div><label className="text-xs font-medium text-[#A89070] block mb-1.5">Local travel (₹ / day / group)</label><input type="number" min="0" value={localTravelPerDay} onChange={(e) => setLocalTravelPerDay(Number(e.target.value))} className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" /></div>
          <div><label className="text-xs font-medium text-[#A89070] block mb-1.5">Verified train return fare (₹ / person)</label><input type="number" min="0" value={trainFarePerPerson || ''} onChange={(e) => setTrainFarePerPerson(Number(e.target.value))} placeholder="From IRCTC" className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" /></div>
          <div><label className="text-xs font-medium text-[#A89070] block mb-1.5">Verified bus return fare (₹ / person)</label><input type="number" min="0" value={busFarePerPerson || ''} onChange={(e) => setBusFarePerPerson(Number(e.target.value))} placeholder="From redBus" className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" /></div>
          <div><label className="text-xs font-medium text-[#A89070] block mb-1.5">Verified flight return fare (₹ / person)</label><input type="number" min="0" value={airFarePerPerson || ''} onChange={(e) => setAirFarePerPerson(Number(e.target.value))} placeholder="From Google Flights" className="w-full bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" /></div>
        </div>

        <section className="rounded-2xl border border-red-500/30 bg-[#141414] p-6 shadow-xl">
          <div><p className="text-xs font-bold uppercase tracking-wider text-red-400">Complete trip breakdown</p><h2 className="mt-1 text-2xl font-black text-[#F5E6D3]">₹{tripTotal.total.toLocaleString('en-IN')} total · ₹{Math.round(tripTotal.total / travelers).toLocaleString('en-IN')} per person</h2><p className="mt-1 text-xs text-[#A89070]">{travelers} travelers · {tripDays} days · {tripTotal.nights} nights · {tripTotal.rooms} rooms</p></div>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-5">{transportChoices.map((choice) => <button key={choice.mode} onClick={() => setSelectedTransportMode(choice.mode)} className={`rounded-xl border p-3 text-left transition-colors ${selectedTransportMode === choice.mode ? 'border-red-500 bg-red-500/15' : 'border-white/[0.08] bg-black/20 hover:border-red-500/50'}`}><p className="text-sm font-black text-[#F5E6D3]">{choice.label}</p><p className="mt-1 font-mono text-xs font-bold text-teal-200">{choice.total === undefined ? 'Fare needed' : `₹${choice.total.toLocaleString('en-IN')} group`}</p><p className="mt-1 text-[10px] text-[#A89070]">{choice.note}</p></button>)}</div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">{[[selectedTransportMode === 'CAR' || selectedTransportMode === 'BIKE' ? 'Travel fuel' : `${selectedTransportMode} return fare`, tripTotal.transport], ['Stay', tripTotal.stay], ['Food', tripTotal.food], ['Activities', tripTotal.activities], ['Local travel', tripTotal.localTravel]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-black/20 p-3"><p className="text-[#A89070]">{label}</p><p className="mt-1 font-mono text-sm font-bold text-[#F5E6D3]">₹{Number(value).toLocaleString('en-IN')}</p></div>)}</div>
          <p className="mt-5 rounded-xl border border-teal-500/20 bg-teal-500/10 p-3 text-xs leading-relaxed text-teal-200">{convenience}</p>
          <p className="mt-3 text-[11px] text-[#A89070]">Fuel is calculated from the route and your entered mileage/fuel rate. Stay, food, activities, and local travel use the amounts you enter from real quotes.</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button onClick={saveTrip} disabled={savingTrip || !selectedTransportReady} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"><Bookmark className="h-4 w-4" />{savingTrip ? 'Saving trip...' : 'Save this trip'}</button>
            {saveMessage && <p role="status" className="text-xs font-semibold text-teal-200">{saveMessage}</p>}
          </div>
        </section>

        {/* Multi-modal Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-['Outfit'] text-[#F5E6D3] flex items-center gap-2">
              Transit Options for {destinationInput}
              {carRoad?.distanceKm !== undefined && (
                <span className="text-xs font-normal text-[#A89070]">
                  (~{carRoad.distanceKm.toLocaleString('en-IN')} km one-way)
                </span>
              )}
            </h2>
            {catalogDestination && (
              <Link
                href={`/destination/${catalogDestination.slug}`}
                className="text-xs font-semibold text-red-400 hover:text-red-300"
              >
                View Full {catalogDestination.city} Budget
              </Link>
            )}
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <a
              href="https://www.google.com/travel/flights"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#F5E6D3]/[0.08] bg-[#141414] p-5 transition-colors hover:border-red-500/40"
            >
              <span><span className="flex items-center gap-2 text-sm font-bold text-[#F5E6D3]"><Plane className="h-5 w-5 text-red-400" /> Check live flight fares</span><span className="mt-1 block text-xs text-[#A89070]">Search {origin} to {destinationInput} with your date on Google Flights for current airline prices.</span></span>
              <ArrowRight className="h-5 w-5 shrink-0 text-red-400" />
            </a>
            <a
              href="https://www.irctc.co.in/nget/train-search"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#F5E6D3]/[0.08] bg-[#141414] p-5 transition-colors hover:border-red-500/40"
            >
              <span><span className="flex items-center gap-2 text-sm font-bold text-[#F5E6D3]"><Train className="h-5 w-5 text-red-400" /> Check live train fares</span><span className="mt-1 block text-xs text-[#A89070]">Search {origin} to {destinationInput} on IRCTC. Fares and seat availability are shown by the booking provider.</span></span>
              <ArrowRight className="h-5 w-5 shrink-0 text-red-400" />
            </a>
            <a
              href="https://www.redbus.in/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#F5E6D3]/[0.08] bg-[#141414] p-5 transition-colors hover:border-red-500/40"
            >
              <span><span className="flex items-center gap-2 text-sm font-bold text-[#F5E6D3]"><Bus className="h-5 w-5 text-red-400" /> Check live bus fares</span><span className="mt-1 block text-xs text-[#A89070]">Search {origin} to {destinationInput} on redBus for current operators, schedules, and prices.</span></span>
              <ArrowRight className="h-5 w-5 shrink-0 text-red-400" />
            </a>
          </div>
        </div>

        {/* Road Cost Formula Transparency Section */}
        {carRoad
          && fuelRate !== undefined
          && carMileage !== undefined
          && roundtripDist !== undefined
          && estimatedFuel !== undefined
          && estimatedTolls !== undefined
          && totalRoadCost !== undefined
          && roadPerPerson !== undefined && (
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#F5E6D3]/[0.08] shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5E6D3]/[0.08]">
              <div>
                <h3 className="text-base font-bold font-['Outfit'] text-[#F5E6D3] flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-[#D4B896]" />
                  Road Trip Mathematical Proof Engine
                </h3>
                <p className="text-xs text-[#A89070]">
                  Live route for {origin} → {destinationInput}, with round-trip fuel calculation
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
                    label: destinationInput,
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
                  Toll data
                </div>
                <div className="text-xl font-bold font-mono text-[#F5E6D3]">
                  {tollsAvailable ? `₹${estimatedTolls.toLocaleString('en-IN')}` : 'Unavailable'}
                </div>
                <div className="text-[11px] text-[#A89070]">
                  Tolls are excluded until a verified toll provider is connected.
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
                  Fuel-only ₹{totalRoadCost.toLocaleString('en-IN')} split {travelers} ways
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
