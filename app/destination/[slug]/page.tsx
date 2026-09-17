'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDestinationBySlug } from '@/lib/destinations';
import { estimateExpenseBreakdown, generateTransportOptions } from '@/lib/cost-engine';
import CostBreakdown from '@/components/CostBreakdown';
import TransportOptions from '@/components/TransportOptions';
import WeatherWidget from '@/components/WeatherWidget';
import Footer from '@/components/Footer';
import {
  MapPin,
  Clock,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Users,
  ChevronLeft,
  GitCompare,
  CheckCircle2,
  Share2,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function DestinationDetailPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();

  const [travelers, setTravelers] = useState(4);
  const [durationDays, setDurationDays] = useState(4);
  const [travelStyle, setTravelStyle] = useState<'BACKPACKER' | 'BUDGET' | 'COMFORT' | 'LUXURY'>(
    'COMFORT'
  );
  const [selectedMonth, setSelectedMonth] = useState('11');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const destination = getDestinationBySlug(slug);

  if (!destination) {
    return (
      <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-['Outfit'] text-white">
          Destination Not Found
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mt-2 mb-6">
          The requested destination slug &quot;{slug}&quot; is not available in our verified catalog.
        </p>
        <Link
          href="/search"
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md"
        >
          Explore All Destinations
        </Link>
      </div>
    );
  }

  const isInternational = destination.countryCode !== 'IN';
  const distanceKm = isInternational ? 3500 : 1200;

  // Compute breakdown dynamically based on current configuration
  const breakdown = estimateExpenseBreakdown({
    destinationId: destination.id,
    originCountry: 'IN',
    isInternational,
    travelers,
    durationDays,
    style: travelStyle,
    targetMonth: selectedMonth,
    distanceKm,
  });

  const transportOptions = generateTransportOptions(
    distanceKm,
    travelers,
    isInternational,
    'IN',
    destination.countryCode
  );

  const handleSaveTrip = async () => {
    setSaving(true);
    try {
      await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${destination.city} Trip with Friends`,
          destinationSlug: destination.slug,
          destinationCity: destination.city,
          destinationCountry: destination.country,
          travelers,
          durationDays,
          estimatedCostPerPerson: breakdown.perPerson.mid,
          totalGroupCost: breakdown.total.mid,
          travelStyle,
          selectedTransportMode: transportOptions[0]?.mode || 'AIR',
        }),
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save trip:', err);
    } finally {
      setSaving(false);
    }
  };

  const sampleItinerary = [
    {
      day: 1,
      title: 'Arrival & Evening Coastal / City Ambience',
      desc: 'Arrival, transfer to lodging, unpack, stroll around local market and authentic dinner.',
    },
    {
      day: 2,
      title: 'Signature Highlights & Adventure Day',
      desc: `Full day exploring ${destination.highlights[0] || 'landmarks'} and ${destination.highlights[1] || 'natural trails'}.`,
    },
    {
      day: 3,
      title: 'Cultural Heritage & Sunset Vantage Point',
      desc: `Experience ${destination.highlights[2] || 'historic quarters'}, artisanal craft shopping, and scenic dusk views.`,
    },
    {
      day: 4,
      title: 'Leisure Morning & Return Transit',
      desc: 'Relaxed breakfast, souvenir picks, checkout and return journey.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#08080F] text-[#F1F0FF]">
      {/* Back Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Search Results
        </button>

        <div className="flex items-center gap-2">
          <Link
            href={`/compare?dest=${destination.slug}&travelers=${travelers}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 border border-white/[0.08] transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-teal-400" />
            Compare Transit Modes
          </Link>
          <button
            onClick={handleSaveTrip}
            disabled={saving || saved}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              saved
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30'
            }`}
          >
            {saved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5" /> Saved to Trips
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Trip'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden h-72 sm:h-96 w-full border border-white/[0.08] shadow-2xl">
          <img
            src={destination.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200'}
            alt={`${destination.city}, ${destination.country}`}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080F] via-[#08080F]/40 to-transparent" />

          {/* Floating badges & title */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 backdrop-blur-md">
                  {destination.region}
                </span>
                {destination.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-black/40 text-slate-300 border border-white/[0.1] backdrop-blur-md"
                  >
                    #{tag.toLowerCase()}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl sm:text-5xl font-black font-['Outfit'] text-white tracking-tight">
                {destination.city},{' '}
                <span className="text-slate-300 font-light">{destination.country}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1.5 line-clamp-2">
                {destination.description}
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="bg-[#0D0D18]/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/[0.1] shrink-0 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Estimated Per Person
              </div>
              <div className="text-2xl font-black font-mono text-white">
                ₹{Math.round(breakdown.perPerson.mid).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-teal-400 font-medium">
                ₹{breakdown.total.mid.toLocaleString('en-IN')} total ({travelers} pax)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dynamic Parameter Adjuster */}
        <div className="p-4 rounded-2xl bg-[#11111E] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <Users className="w-4 h-4 text-violet-400" />
              <span className="text-slate-400">Travelers:</span>
              <select
                value={travelers}
                onChange={(e) => setTravelers(parseInt(e.target.value, 10))}
                className="bg-[#18182C] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} person{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span className="text-slate-400">Duration:</span>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value, 10))}
                className="bg-[#18182C] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white font-bold"
              >
                {[2, 3, 4, 5, 7, 10, 14].map((n) => (
                  <option key={n} value={n}>
                    {n} Days
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">Style:</span>
              <select
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value as any)}
                className="bg-[#18182C] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white font-bold"
              >
                <option value="BACKPACKER">Backpacker</option>
                <option value="BUDGET">Budget</option>
                <option value="COMFORT">Comfort</option>
                <option value="LUXURY">Luxury</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Deterministic cost model calibrated for India
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Full Cost Breakdown (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            <CostBreakdown
              breakdown={breakdown}
              travelers={travelers}
              durationDays={durationDays}
            />

            {/* Transport Options Panel */}
            <TransportOptions
              options={transportOptions}
              travelers={travelers}
            />

            {/* Curated Itinerary Preview */}
            <div className="bg-[#1A1A1A] border border-[#F5E6D3]/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-base font-bold font-['Outfit'] text-white">
                    Suggested {durationDays}-Day Itinerary Outline
                  </h3>
                  <p className="text-xs text-slate-400">
                    Optimized for group flow, local transport proximity and budget efficiency
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  Customizable
                </span>
              </div>

              <div className="space-y-3">
                {sampleItinerary.slice(0, durationDays).map((item) => (
                  <div
                    key={item.day}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-start gap-3.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 font-bold text-xs flex items-center justify-center shrink-0">
                      D{item.day}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Weather, Highlights, and Quick Specs (1 col) */}
          <div className="space-y-6">
            <WeatherWidget
              climateZone={destination.climateZone}
              seasonProfile={destination.seasonProfile}
              currentMonth={selectedMonth}
            />

            {/* Top Highlights Card */}
            <div className="bg-[#1A1A1A] border border-[#F5E6D3]/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold font-['Outfit'] text-white">
                Top Group Highlights
              </h3>
              <div className="space-y-2.5">
                {destination.highlights.map((hl, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action CTA Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-red-950/40 to-[#1A1A1A] border border-red-500/30 space-y-3">
              <h4 className="text-sm font-bold text-white font-['Outfit']">
                Ready to plan this trip?
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Save this trip to invite friends, split expenses automatically, and lock in
                dates.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleSaveTrip}
                  disabled={saving || saved}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Bookmark className="w-4 h-4" />
                  {saved ? 'Saved to Your Trips' : 'Save Trip to My Plan'}
                </button>
                <Link
                  href={`/compare?dest=${destination.slug}&travelers=${travelers}`}
                  className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-colors text-center"
                >
                  Compare Flight vs Train vs Road
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
