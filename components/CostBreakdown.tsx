'use client';

import { useState } from 'react';
import type { ExpenseBreakdown } from '@/lib/types';
import {
  Plane,
  Building,
  Utensils,
  Navigation,
  Ticket,
  ShieldAlert,
  Users,
  User,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
} from 'lucide-react';

interface Props {
  breakdown: ExpenseBreakdown;
  travelers: number;
  durationDays: number;
  currency?: string;
}

export default function CostBreakdown({
  breakdown,
  travelers,
  durationDays,
  currency = '₹',
}: Props) {
  const [viewMode, setViewMode] = useState<'PER_PERSON' | 'GROUP'>('PER_PERSON');
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  const divisor = viewMode === 'PER_PERSON' ? travelers : 1;

  const formatAmount = (val: number) => {
    const amount = Math.round(val / divisor);
    return `${currency}${amount.toLocaleString('en-IN')}`;
  };

  const categories = [
    {
      id: 'transport',
      label: 'Transport (Roundtrip)',
      amount: breakdown.transport.mid,
      low: breakdown.transport.low,
      high: breakdown.transport.high,
      color: 'bg-violet-500',
      textColor: 'text-violet-400',
      icon: Plane,
      details: 'Roundtrip transit (flights / train / car)',
    },
    {
      id: 'accommodation',
      label: `Stay (${durationDays} Nights)`,
      amount: breakdown.accommodation.mid,
      low: breakdown.accommodation.low,
      high: breakdown.accommodation.high,
      color: 'bg-teal-500',
      textColor: 'text-teal-400',
      icon: Building,
      details: `${Math.ceil(travelers / 2)} room(s) shared`,
    },
    {
      id: 'food',
      label: 'Meals & Dining',
      amount: breakdown.food.mid,
      low: breakdown.food.low,
      high: breakdown.food.high,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      icon: Utensils,
      details: `${durationDays} days of daily dining`,
    },
    {
      id: 'localTransport',
      label: 'Local Transit & Cabs',
      amount: breakdown.localTransport.mid,
      low: breakdown.localTransport.low,
      high: breakdown.localTransport.high,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
      icon: Navigation,
      details: 'Intra-city cabs, autos, fuel & parking',
    },
    {
      id: 'activities',
      label: 'Sightseeing & Passes',
      amount: breakdown.activities.mid,
      low: breakdown.activities.low,
      high: breakdown.activities.high,
      color: 'bg-pink-500',
      textColor: 'text-pink-400',
      icon: Ticket,
      details: 'Attractions, entry fees & activities',
    },
    ...(breakdown.visa && breakdown.visa.mid > 0
      ? [
          {
            id: 'visa',
            label: 'Visa & Entry Documentation',
            amount: breakdown.visa.mid,
            low: breakdown.visa.low,
            high: breakdown.visa.high,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-400',
            icon: FileCheck,
            details: 'eVisa / processing fees per person',
          },
        ]
      : []),
    {
      id: 'contingency',
      label: 'Contingency Buffer (10%)',
      amount: breakdown.contingency.mid,
      low: breakdown.contingency.low,
      high: breakdown.contingency.high,
      color: 'bg-slate-400',
      textColor: 'text-slate-400',
      icon: ShieldAlert,
      details: 'Safety reserve for unplanned expenses',
    },
  ];

  const totalMid = breakdown.total.mid;

  return (
    <div className="bg-[#1A1A1A] border border-[#F5E6D3]/[0.08] rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <h3 className="text-lg font-bold font-['Outfit'] text-white flex items-center gap-2">
            Transparent Cost Breakdown
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
              PRD Formula Engine
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Calculated for {travelers} traveler{travelers > 1 ? 's' : ''} across {durationDays} day
            {durationDays > 1 ? 's' : ''}
          </p>
        </div>

        {/* Toggle Per Person / Total Group */}
        <div className="flex items-center bg-[#090912] p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setViewMode('PER_PERSON')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'PER_PERSON'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Per Person
          </button>
          <button
            onClick={() => setViewMode('GROUP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'GROUP'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Total Group ({travelers}x)
          </button>
        </div>
      </div>

      {/* Grand Total Hero Banner */}
        <div className="my-5 p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-red-950/20 to-[#1A1A1A] border border-red-500/20 flex items-center justify-between">
        <div>
          <div className="text-xs text-violet-300/80 uppercase tracking-wider font-semibold">
            {viewMode === 'PER_PERSON' ? 'Estimated Cost Per Traveler' : 'Total Group Commitment'}
          </div>
          <div className="text-3xl sm:text-4xl font-black font-['Outfit'] text-white mt-1">
            {formatAmount(totalMid)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Expected range: {formatAmount(breakdown.total.low)} – {formatAmount(breakdown.total.high)}
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs text-slate-400">Includes roundtrip transport</div>
          <div className="text-xs text-teal-400 font-medium mt-0.5">Zero hidden fees</div>
        </div>
      </div>

      {/* Visual Stacked Progress Bar */}
      <div className="mb-6">
        <div className="h-3.5 w-full rounded-full bg-[#0B0B14] p-0.5 flex overflow-hidden gap-0.5 border border-white/[0.06]">
          {categories.map((cat) => {
            const pct = Math.max(1, (cat.amount / totalMid) * 100);
            return (
              <div
                key={cat.id}
                style={{ width: `${pct}%` }}
                className={`${cat.color} h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 relative group`}
                title={`${cat.label}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-400">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cat.color}`} />
              <span>{cat.label.split(' ')[0]}</span>
              <span className="text-slate-500 font-mono">
                {((cat.amount / totalMid) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Rows */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center ${cat.textColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{cat.label}</div>
                  <div className="text-xs text-slate-400">{cat.details}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold font-mono text-white">
                  {formatAmount(cat.amount)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {formatAmount(cat.low)} – {formatAmount(cat.high)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Formula Transparency Collapsible */}
      <div className="mt-5 pt-4 border-t border-white/[0.06]">
        <button
          onClick={() => setShowFormulaDetails(!showFormulaDetails)}
          className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-violet-400" />
            How BagPack calculated this breakdown
          </span>
          {showFormulaDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showFormulaDetails && (
          <div className="mt-3 p-3.5 rounded-xl bg-[#090914] border border-white/[0.06] text-xs text-slate-400 space-y-2 leading-relaxed">
            <p>
              • <strong className="text-slate-200">Accommodation:</strong> Calculated with room sharing{' '}
              <code className="text-teal-300 font-mono">ceil({travelers}/2) = {Math.ceil(travelers / 2)} room(s)</code>{' '}
              for {durationDays} nights. Group room sharing optimizes per-person rates.
            </p>
            <p>
              • <strong className="text-slate-200">Contingency Buffer:</strong> A 10% safety margin is
              factored into total estimation to guard against seasonal surge, toll variations, and unexpected baggage fees.
            </p>
            <p>
              • <strong className="text-slate-200">Confidence Model:</strong> Verified against
              historical inter-city fares, IRCTC slab tariffs, and baseline standard meal cost models.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
