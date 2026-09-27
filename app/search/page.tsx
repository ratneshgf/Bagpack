'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type {
  RecommendationResult,
  SearchRequest,
  TripScope,
  TravelStyle,
  InterestTag,
} from '@/lib/types';

type BudgetScope = 'GROUP' | 'PER_PERSON';
type SortOption = 'SCORE' | 'PRICE_ASC' | 'TIME_ASC' | 'WEATHER';

function parseEnum<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}
import RecommendationCard from '@/components/RecommendationCard';
import LiveIndiaResearch from '@/components/LiveIndiaResearch';
import Footer from '@/components/Footer';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import {
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  Sparkles,
  Users,
  Wallet,
  Calendar,
  MapPin,
  RefreshCw,
  Compass,
  ChevronDown,
  Check,
  AlertCircle,
} from 'lucide-react';

function SearchResultsContent() {
  const searchParams = useSearchParams();

  // Query parameters state
  const [origin, setOrigin] = useState(searchParams.get('origin') || 'Delhi, India');
  const [travelers, setTravelers] = useState(
    parseInt(searchParams.get('travelers') || '4', 10)
  );
  const [budgetAmount, setBudgetAmount] = useState(
    parseInt(searchParams.get('budget') || '15000', 10)
  );
  const [budgetScope, setBudgetScope] = useState<BudgetScope>(() =>
    parseEnum(searchParams.get('budgetScope'), ['GROUP', 'PER_PERSON'] as const, 'GROUP')
  );
  const [durationDays, setDurationDays] = useState(
    parseInt(searchParams.get('duration') || '4', 10)
  );
  const [tripScope, setTripScope] = useState<TripScope>(() =>
    parseEnum(searchParams.get('tripScope'), ['DOMESTIC', 'INTERNATIONAL', 'BOTH'] as const, 'BOTH')
  );
  const [style, setStyle] = useState<TravelStyle>(() =>
    parseEnum(searchParams.get('style'), ['BACKPACKER', 'BUDGET', 'COMFORT', 'LUXURY'] as const, 'BUDGET')
  );
  const [selectedInterests, setSelectedInterests] = useState<InterestTag[]>(
    searchParams.get('interests')
      ? (searchParams.get('interests')?.split(',') as InterestTag[])
      : []
  );
  const [month, setMonth] = useState(searchParams.get('month') || '2026-11');

  // UI / Filter state
  const [sortBy, setSortBy] = useState<'SCORE' | 'PRICE_ASC' | 'TIME_ASC' | 'WEATHER'>(
    'SCORE'
  );
  const [onlyWithinBudget, setOnlyWithinBudget] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const perPersonBudget =
    budgetScope === 'GROUP' ? Math.round(budgetAmount / travelers) : budgetAmount;

  // Fetch recommendations from API
  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: SearchRequest = {
        originPlaceId: origin.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        originLabel: origin,
        travelers,
        budget: {
          amount: budgetAmount,
          currency: 'INR',
          scope: budgetScope,
        },
        durationDays,
        tripScope,
        style,
        interests: selectedInterests,
        dates: {
          mode: 'MONTH',
          month: month.split('-')[1] || '11',
        },
      };

      const res = await fetch('/api/search/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to compute destination recommendations');
      }

      const data = await res.json();
      setResults(data.recommendations || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error running recommendation engine';
      console.error(error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // A slider can emit many events per second; wait briefly so only the final
    // filter value triggers the server ranking request.
    const timer = window.setTimeout(() => fetchResults(), 250);
    return () => window.clearTimeout(timer);
  }, [origin, travelers, budgetAmount, budgetScope, durationDays, tripScope, style, selectedInterests, month]);

  // Filter & Sort logic
  const filteredResults = useMemo(() => {
    let items = [...results];

    if (onlyWithinBudget) {
      items = items.filter((r) => !r.isOverBudget);
    }

    if (tripScope === 'DOMESTIC') {
      items = items.filter((r) => r.destination.countryCode === 'IN');
    } else if (tripScope === 'INTERNATIONAL') {
      items = items.filter((r) => r.destination.countryCode !== 'IN');
    }

    items.sort((a, b) => {
      if (sortBy === 'SCORE') return b.score - a.score;
      if (sortBy === 'PRICE_ASC') return a.estimatedTotal.mid - b.estimatedTotal.mid;
      if (sortBy === 'TIME_ASC') return a.travelTimeHours - b.travelTimeHours;
      if (sortBy === 'WEATHER') return b.weatherFit - a.weatherFit;
      return 0;
    });

    return items;
  }, [results, onlyWithinBudget, tripScope, sortBy]);

  const allInterestTags: { tag: InterestTag; label: string }[] = [
    { tag: 'BEACH', label: 'Beach' },
    { tag: 'DESERT', label: 'Desert' },
    { tag: 'MOUNTAINS', label: 'Mountains' },
    { tag: 'ADVENTURE', label: 'Adventure' },
    { tag: 'NIGHTLIFE', label: 'Nightlife' },
    { tag: 'CULTURE', label: 'Culture' },
    { tag: 'FOOD', label: 'Food' },
    { tag: 'RELAXATION', label: 'Relaxation' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5E6D3]">
      {/* Top Header Banner */}
      <div className="border-b border-[#F5E6D3]/[0.08] bg-[#111111]/80 backdrop-blur-xl sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Context badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5E6D3]/[0.04] border border-[#F5E6D3]/[0.08] text-xs font-semibold text-[#E8D5BD]">
                <MapPin className="w-3.5 h-3.5 text-[#D4B896]" />
                From: {origin}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5E6D3]/[0.04] border border-[#F5E6D3]/[0.08] text-xs font-semibold text-[#E8D5BD]">
                <Users className="w-3.5 h-3.5 text-red-400" />
                {travelers} Travelers
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5E6D3]/[0.04] border border-[#F5E6D3]/[0.08] text-xs font-semibold text-[#E8D5BD]">
                <Calendar className="w-3.5 h-3.5 text-[#D4B896]" />
                {durationDays} Days · {month}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-300">
                <Wallet className="w-3.5 h-3.5" />
                Budget: ₹{budgetAmount.toLocaleString('en-IN')}{' '}
                <span className="text-[10px] font-normal opacity-75">
                  ({budgetScope === 'GROUP' ? 'Total' : 'Per Pax'})
                </span>
              </div>
            </div>

            {/* Sort & Quick Scope Switch */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center gap-2 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#A89070]" />
                <span className="text-[#A89070] hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-[#1A1A1A] border border-[#F5E6D3]/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-[#F5E6D3] font-medium focus:outline-none focus:border-red-500"
                >
                  <option value="SCORE">Highest Match Score</option>
                  <option value="PRICE_ASC">Lowest Cost First</option>
                  <option value="TIME_ASC">Shortest Travel Time</option>
                  <option value="WEATHER">Best Weather</option>
                </select>
              </div>

              <button
                onClick={() => fetchResults()}
                className="p-1.5 rounded-lg bg-[#F5E6D3]/[0.04] hover:bg-[#F5E6D3]/[0.08] border border-[#F5E6D3]/[0.08] text-[#D4B896] hover:text-[#F5E6D3]"
                title="Refresh Results"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#141414] border border-[#F5E6D3]/[0.08] rounded-2xl p-5 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5E6D3]/[0.06]">
                <h3 className="text-sm font-bold font-['Outfit'] text-[#F5E6D3] flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-red-400" />
                  Live Adjustments
                </h3>
                <span className="text-[11px] font-semibold text-red-400">Live Re-rank</span>
              </div>

              {/* Live Budget Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A89070] font-medium">Budget ({budgetScope})</span>
                  <span className="text-[#F5E6D3] font-bold font-mono">
                    ₹{budgetAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={400000}
                  step={5000}
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(parseInt(e.target.value, 10))}
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-[#222222] rounded-lg"
                />
                <p className="text-[10px] text-[#A89070]">Minimum budget: ₹5,000</p>
                <div className="flex justify-between text-[10px] text-[#A89070] font-mono">
                  <span>₹15k</span>
                  <span>₹200k</span>
                  <span>₹400k</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#A89070] font-medium block">Starting from</label>
                <LocationAutocomplete value={origin} onChange={setOrigin} type="ORIGIN" placeholder="Your city" className="w-full bg-[#0D0D0D] border border-[#F5E6D3]/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5E6D3]" />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#A89070] font-medium block">Trip length</label>
                <div className="grid grid-cols-4 gap-1 bg-[#0D0D0D] p-1 rounded-xl border border-[#F5E6D3]/[0.06]">{[1, 2, 3, 4, 5, 7].map((days) => <button key={days} onClick={() => setDurationDays(days)} className={`rounded-lg py-1.5 text-[11px] font-bold ${durationDays === days ? 'bg-red-600 text-white' : 'text-[#A89070] hover:text-[#F5E6D3]'}`}>{days}d</button>)}</div>
              </div>

              {/* Travelers Counter */}
              <div className="space-y-2">
                <label className="text-xs text-[#A89070] font-medium block">
                  Travelers in Group
                </label>
                <div className="flex items-center justify-between bg-[#0D0D0D] p-1.5 rounded-xl border border-[#F5E6D3]/[0.06]">
                  {[1, 2, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      onClick={() => setTravelers(num)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        travelers === num
                          ? 'bg-red-600 text-white shadow-md'
                          : 'text-[#A89070] hover:text-[#F5E6D3]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope Selector */}
              <div className="space-y-2">
                <label className="text-xs text-[#A89070] font-medium block">
                  Destination Scope
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#0D0D0D] p-1 rounded-xl border border-[#F5E6D3]/[0.06]">
                  {(['BOTH', 'DOMESTIC', 'INTERNATIONAL'] as TripScope[]).map((sc) => (
                    <button
                      key={sc}
                      onClick={() => setTripScope(sc)}
                      className={`py-1.5 rounded-lg text-[11px] font-semibold text-center transition-all ${
                        tripScope === sc
                          ? 'bg-red-600/25 border border-red-500/40 text-red-200'
                          : 'text-[#A89070] hover:text-[#F5E6D3]'
                      }`}
                    >
                      {sc === 'BOTH' ? 'All' : sc === 'DOMESTIC' ? 'India' : 'Abroad'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel Style */}
              <div className="space-y-2">
                <label className="text-xs text-[#A89070] font-medium block">Travel Style</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['BACKPACKER', 'BUDGET', 'COMFORT', 'LUXURY'] as TravelStyle[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStyle(st)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border text-left transition-all ${
                        style === st
                          ? 'bg-[#D4B896]/10 border-[#D4B896]/40 text-[#D4B896]'
                          : 'bg-[#F5E6D3]/[0.02] border-[#F5E6D3]/[0.05] text-[#A89070] hover:text-[#D4B896]'
                      }`}
                    >
                      {st.charAt(0) + st.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests Toggles */}
              <div className="space-y-2">
                <label className="text-xs text-[#A89070] font-medium block">Vibe & Interests</label>
                <div className="flex flex-wrap gap-1.5">
                  {allInterestTags.map(({ tag, label }) => {
                    const isSelected = selectedInterests.includes(tag);
                    return (
                      <button
                        key={tag}
                      onClick={() => setSelectedInterests(isSelected ? [] : [tag])}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                          isSelected
                            ? 'bg-red-600/25 border-red-500/40 text-red-300'
                            : 'bg-[#F5E6D3]/[0.02] border-[#F5E6D3]/[0.05] text-[#A89070] hover:text-[#D4B896]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Only within budget toggle */}
              <div className="pt-2 border-t border-[#F5E6D3]/[0.06]">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#D4B896] font-medium select-none">
                  <input
                    type="checkbox"
                    checked={onlyWithinBudget}
                    onChange={(e) => setOnlyWithinBudget(e.target.checked)}
                    className="rounded bg-[#1A1A1A] border-[#F5E6D3]/[0.1] text-red-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  Strictly within budget only
                </label>
              </div>
            </div>
          </div>

          {/* Results Grid Area */}
          <div className="lg:col-span-3 space-y-6">
            <LiveIndiaResearch
              initialQuery={`${selectedInterests.map((interest) => interest.toLowerCase()).join(' ')} ${style.toLowerCase()} hidden gems`}
            />

            {/* Results count & status */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-['Outfit'] text-[#F5E6D3]">
                  Modeled Budget Shortlist
                </h2>
                <p className="text-xs text-[#A89070] mt-0.5">
                  Showing {filteredResults.length} options tailored for your ₹
                  {budgetAmount.toLocaleString('en-IN')} budget
                </p>
              </div>

              {filteredResults.length > 0 && (
                <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {filteredResults.filter((r) => !r.isOverBudget).length} within budget
                </div>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-96 rounded-2xl bg-[#141414]/60 border border-[#F5E6D3]/[0.05] animate-pulse p-4 flex flex-col justify-between"
                  >
                    <div className="h-44 bg-[#F5E6D3]/[0.03] rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-4 bg-[#F5E6D3]/[0.05] rounded w-1/2" />
                      <div className="h-6 bg-[#F5E6D3]/[0.05] rounded w-3/4" />
                    </div>
                    <div className="h-10 bg-[#F5E6D3]/[0.03] rounded-xl" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredResults.length === 0 && (
              <div className="text-center py-16 px-4 rounded-2xl bg-[#141414] border border-[#F5E6D3]/[0.08] space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#D4B896]/10 border border-[#D4B896]/20 text-[#D4B896] flex items-center justify-center mx-auto">
                  <Compass className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-[#F5E6D3]">
                  No destinations fit this exact criteria
                </h3>
                <p className="text-xs text-[#A89070] max-w-md mx-auto">
                  Try adjusting your budget slider up by 15-20%, changing travel style to
                  Backpacker, or selecting both Domestic and International options.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setBudgetAmount((prev) => Math.round(prev * 1.25));
                      setOnlyWithinBudget(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md"
                  >
                    Increase Budget (+25%)
                  </button>
                  <button
                    onClick={() => setOnlyWithinBudget(false)}
                    className="px-4 py-2 rounded-xl bg-[#F5E6D3]/[0.05] hover:bg-[#F5E6D3]/[0.1] text-[#D4B896] text-xs font-semibold border border-[#F5E6D3]/[0.08]"
                  >
                    Show Near-Budget Trips
                  </button>
                </div>
              </div>
            )}

            {/* Results Grid */}
            {!loading && filteredResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredResults.map((result) => (
                  <RecommendationCard
                    key={result.destinationId}
                    result={result}
                    travelers={travelers}
                    durationDays={durationDays}
                    userBudgetPerPerson={perPersonBudget}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-[#A89070] text-sm">
          Loading recommendations...
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
