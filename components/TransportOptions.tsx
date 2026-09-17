'use client';

import { useState } from 'react';
import type { TransportOption } from '@/lib/types';
import {
  Plane,
  Train,
  Car,
  Bus,
  Clock,
  Zap,
  TrendingDown,
  Award,
} from 'lucide-react';

interface Props {
  options: TransportOption[];
  travelers: number;
  onSelectOption?: (option: TransportOption) => void;
  selectedOptionId?: string;
}

export default function TransportOptions({
  options,
  travelers,
  onSelectOption,
  selectedOptionId,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>(
    selectedOptionId || options[0]?.id || options[0]?.mode || ''
  );

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

  const getBadgeStyle = (badge?: string) => {
    switch (badge) {
      case 'FASTEST':
        return {
          icon: Zap,
          text: 'Fastest',
          className: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        };
      case 'CHEAPEST':
        return {
          icon: TrendingDown,
          text: 'Cheapest',
          className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        };
      case 'BEST_VALUE':
        return {
          icon: Award,
          text: 'Best Value',
          className: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
        };
      default:
        return null;
    }
  };

  const handleSelect = (opt: TransportOption) => {
    const optId = opt.id || opt.mode;
    setSelectedId(optId);
    if (onSelectOption) onSelectOption(opt);
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#F5E6D3]/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <h3 className="text-base font-bold font-['Outfit'] text-white">
            Available Transport Modes
          </h3>
          <p className="text-xs text-slate-400">
            Compare roundtrip transit alternatives for {travelers} traveler{travelers > 1 ? 's' : ''}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
          {options.length} Mode{options.length > 1 ? 's' : ''} Analyzed
        </span>
      </div>

      <div className="space-y-3">
        {options.map((opt, idx) => {
          const optId = opt.id || `${opt.mode}-${idx}`;
          const optTitle = opt.title || `${opt.mode} Transit`;
          const Icon = getModeIcon(opt.mode);
          const isSelected = selectedId === optId;
          const badge = getBadgeStyle(opt.badge);
          const perPerson = Math.round(
            opt.totalCost / (opt.pricingBasis === 'GROUP' ? travelers : 1)
          );

          return (
            <div
              key={optId}
              onClick={() => handleSelect(opt)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-violet-950/20 border-violet-500/50 shadow-md shadow-violet-600/10 ring-1 ring-violet-500/30'
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                        : 'bg-white/[0.04] border-white/[0.08] text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{optTitle}</h4>
                      {badge && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                        >
                          <badge.icon className="w-3 h-3" />
                          {badge.text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {Math.floor(opt.durationMinutes / 60)}h{' '}
                        {opt.durationMinutes % 60 > 0 ? `${opt.durationMinutes % 60}m` : ''}{' '}
                        one-way
                      </span>
                      <span>•</span>
                      <span>{opt.operator || opt.mode}</span>
                    </div>
                  </div>
                </div>

                {/* Price block */}
                <div className="text-right flex sm:flex-col justify-between sm:justify-center items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/[0.05]">
                  <div>
                    <div className="text-base font-bold font-mono text-white">
                      ₹{perPerson.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-slate-400 ml-1">/ person</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      ₹{opt.totalCost.toLocaleString('en-IN')} total group
                    </div>
                  </div>
                </div>
              </div>

              {/* Road breakdown specifics if applicable */}
              {opt.roadBreakdown && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                  <div>
                    Distance:{' '}
                    <strong className="text-slate-200">{opt.roadBreakdown.distanceKm} km</strong>
                  </div>
                  <div>
                    Fuel:{' '}
                    <strong className="text-slate-200">
                      ₹{opt.roadBreakdown.fuelCost.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    Tolls:{' '}
                    <strong className="text-slate-200">
                      ₹{opt.roadBreakdown.tollEstimate.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    Vehicle:{' '}
                    <strong className="text-teal-300">
                      {opt.roadBreakdown.vehicleType.replace('_', ' ')}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
