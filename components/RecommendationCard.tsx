'use client';

import Link from 'next/link';
import type { RecommendationResult } from '@/lib/types';
import ConfidenceBadge from './ConfidenceBadge';
import {
  MapPin,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Plane,
  Car,
  Train,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const transportIcons: Partial<Record<RecommendationResult['bestTransportMode'], LucideIcon>> = {
  AIR: Plane,
  RAIL: Train,
  CAR: Car,
};

interface Props {
  result: RecommendationResult;
  travelers: number;
  durationDays: number;
  userBudgetPerPerson?: number;
}

export default function RecommendationCard({
  result,
  travelers,
  durationDays,
  userBudgetPerPerson,
}: Props) {
  const {
    destination,
    estimatedTotal,
    score,
    budgetUtilization,
    bestTransportMode,
    travelTimeHours,
    reasons,
    confidence,
    isOverBudget,
    weatherFit,
  } = result;

  const costPerPerson = Math.round(estimatedTotal.mid / travelers);

  const budgetDelta = userBudgetPerPerson
    ? userBudgetPerPerson - costPerPerson
    : null;

  const TransportIcon = transportIcons[bestTransportMode] ?? Plane;

  return (
    <div className="group bg-[#11111E] border border-white/[0.08] hover:border-violet-500/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-violet-600/10 transition-all duration-300 flex flex-col h-full">
      {/* Top Media Banner */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-900">
        <img
          src={destination.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'}
          alt={`${destination.city}, ${destination.country}`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#11111E] via-[#11111E]/30 to-transparent" />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <div className="px-2.5 py-1 rounded-full bg-[#080810]/80 backdrop-blur-md border border-white/[0.1] text-xs font-bold text-teal-300 flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3 text-teal-400" />
            {Math.round(score * 100)}% Match
          </div>
          <ConfidenceBadge confidence={confidence} />
        </div>

        {/* Location title in image bottom */}
        <div className="absolute bottom-3 left-4 right-4 z-10">
          <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            {destination.country} · {destination.region}
          </div>
          <h3 className="text-2xl font-black font-['Outfit'] text-white tracking-tight leading-none mt-0.5">
            {destination.city}
          </h3>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Cost & Budget Fit Summary */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Per Traveler ({durationDays}d)
            </div>
            <div className="text-2xl font-black font-mono text-white mt-0.5">
              ₹{costPerPerson.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              ₹{estimatedTotal.mid.toLocaleString('en-IN')} total ({travelers}x)
            </div>
          </div>

          {budgetDelta !== null && (
            <div className="text-right">
              {budgetDelta >= 0 ? (
                <div className="text-xs font-semibold text-emerald-400 flex items-center justify-end gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  ₹{budgetDelta.toLocaleString('en-IN')} under
                </div>
              ) : (
                <div className="text-xs font-semibold text-rose-400 flex items-center justify-end gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  ₹{Math.abs(budgetDelta).toLocaleString('en-IN')} over
                </div>
              )}
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {budgetUtilization}% of max budget
              </div>
            </div>
          )}
        </div>

        {/* Travel Logistics Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <TransportIcon className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="truncate">
              Best via {bestTransportMode}
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <Clock className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              ~{travelTimeHours}h one-way
            </span>
          </div>
        </div>

        {/* AI & Algorithm match highlights */}
        {reasons && reasons.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Why it fits your group
            </div>
            <div className="space-y-1">
              {reasons.slice(0, 2).map((reason, i) => (
                <div key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="truncate">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 pt-1">
          {destination.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.06]"
            >
              #{tag.toLowerCase()}
            </span>
          ))}
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20">
            Weather {weatherFit}/10
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2 border-t border-white/[0.06]">
          <Link
            href={`/destination/${destination.slug}`}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold text-center shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            Full Breakdown
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/compare?dest=${destination.slug}&travelers=${travelers}`}
            className="py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-colors"
            title="Compare road, rail & air options"
          >
            Compare
          </Link>
        </div>
        {destination.countryCode === 'IN' && (
          <a
            href="https://www.irctc.co.in/nget/train-search"
            target="_blank"
            rel="noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-[#F5E6D3]/[0.04] hover:bg-[#F5E6D3]/[0.08] text-[#D4B896] text-xs font-semibold border border-[#F5E6D3]/[0.08] transition-colors text-center flex items-center justify-center gap-1.5"
          >
            <Train className="w-3.5 h-3.5" /> Check live seats & book on IRCTC
          </a>
        )}
      </div>
    </div>
  );
}
