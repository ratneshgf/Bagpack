'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ExternalLink, MessageCircle, Search, Star } from 'lucide-react';
import type { IndiaResearchResponse } from '@/lib/types';

const OpenStreetMapView = dynamic(() => import('./OpenStreetMapView'), {
  ssr: false,
  loading: () => <div className="h-72 rounded-xl bg-[#0D0D0D] animate-pulse" />,
});

export default function LiveIndiaResearch({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<IndiaResearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const research = async (value = query) => {
    const normalized = value.trim();
    if (normalized.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/research/india', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: normalized }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Live research failed.');
      setData(result);
    } catch (researchError) {
      setData(null);
      setError(researchError instanceof Error ? researchError.message : 'Live research failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuery(initialQuery);
    const timer = window.setTimeout(() => research(initialQuery), 500);
    return () => window.clearTimeout(timer);
    // The initial filter phrase is the only automatic trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return (
    <section className="rounded-2xl border border-red-500/20 bg-[#141414] p-5 space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Live destination research</div>
        <h2 className="text-lg font-bold text-[#F5E6D3]">OpenStreetMap places across India</h2>
        <p className="text-xs text-[#A89070] mt-1">
          Enter any theme or location. Geographic matches are fetched live from OpenStreetMap.
        </p>
      </div>

      <form
        onSubmit={(event) => { event.preventDefault(); research(); }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. underrated waterfalls in Maharashtra"
          className="input flex-1"
          aria-label="Research Indian travel places"
        />
        <button type="submit" disabled={loading || query.trim().length < 2} className="btn-primary disabled:opacity-50">
          <Search className="w-4 h-4" /> {loading ? 'Analyzing…' : 'Analyze live'}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
          {error} The public OpenStreetMap service may be busy; try again shortly.
        </div>
      )}

      {data && (
        <>
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
            <span className="rounded-full border border-[#D4B896]/20 bg-[#D4B896]/10 px-2.5 py-1 text-[#D4B896]">
              OpenStreetMap: live
            </span>
            <span className="rounded-full border border-[#F5E6D3]/10 px-2.5 py-1 text-[#A89070]">
              Reddit: {data.sources.reddit.toLowerCase().replace('_', ' ')}
            </span>
          </div>

          <OpenStreetMapView
            points={data.places.flatMap((place) =>
              place.latitude !== undefined && place.longitude !== undefined
                ? [{ latitude: place.latitude, longitude: place.longitude, label: place.name }]
                : []
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.places.map((place) => (
              <article key={place.id} className="rounded-xl border border-[#F5E6D3]/[0.08] bg-[#0D0D0D] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#F5E6D3]">{place.name}</h3>
                    <p className="text-[11px] text-[#A89070] mt-0.5">{place.address}</p>
                  </div>
                  {place.rating && (
                    <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-[#D4B896]">
                      <Star className="w-3.5 h-3.5 fill-current" /> {place.rating}
                      <span className="font-normal text-[#A89070]">({place.reviewCount?.toLocaleString('en-IN') ?? 0})</span>
                    </div>
                  )}
                </div>

                {place.reviewHighlights[0] && (
                  <div className="rounded-lg bg-[#F5E6D3]/[0.03] p-3 text-[11px] leading-relaxed text-[#D4B896]">
                    “{place.reviewHighlights[0].text}”
                    <div className="mt-1.5 text-[10px] text-[#A89070]">
                      {place.reviewHighlights[0].author ?? 'Community source'} · {place.reviewHighlights[0].published ?? 'External note'}
                    </div>
                  </div>
                )}

                <a href={place.mapUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300">
                  View on OpenStreetMap <ExternalLink className="w-3 h-3" />
                </a>
              </article>
            ))}
          </div>

          {data.redditSignals.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4B896]">Community discussions</h3>
              {data.redditSignals.slice(0, 5).map((signal) => (
                <a key={signal.url} href={signal.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-[#F5E6D3]/[0.06] p-3 text-xs text-[#D4B896] hover:border-red-500/30">
                  <span className="truncate">{signal.title}</span>
                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-[#A89070]"><MessageCircle className="w-3 h-3" /> {signal.commentCount}</span>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
