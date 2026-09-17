'use client';

import { Sun, CloudRain, Wind, Thermometer, Users, Award, Calendar } from 'lucide-react';
import type { ClimateZone } from '@/lib/types';

interface SeasonData {
  weatherScore: number;
  crowdLevel: string;
  description: string;
}

interface Props {
  climateZone?: ClimateZone;
  seasonProfile?: Record<string, SeasonData>;
  currentMonth?: string; // '01' - '12'
}

export default function WeatherWidget({
  climateZone = 'TEMPERATE',
  seasonProfile,
  currentMonth = '10',
}: Props) {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const activeSeason = seasonProfile?.[currentMonth] || {
    weatherScore: 8,
    crowdLevel: 'MODERATE',
    description: 'Pleasant temperatures with low precipitation likelihood.',
  };

  const scoreColor =
    activeSeason.weatherScore >= 8
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : activeSeason.weatherScore >= 6
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  const crowdBadge = {
    LOW: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    MODERATE: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    HIGH: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    PEAK: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  }[activeSeason.crowdLevel] || 'bg-slate-500/10 text-slate-300 border-slate-500/20';

  return (
    <div className="bg-[#1A1A1A] border border-[#F5E6D3]/[0.08] rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <h3 className="text-base font-bold font-['Outfit'] text-white flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" />
            Season & Weather Intelligence
          </h3>
          <p className="text-xs text-slate-400">
            Open-Meteo climate baseline · {climateZone.toLowerCase()} zone
          </p>
        </div>

        <div className={`px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${scoreColor}`}>
          <Award className="w-4 h-4" />
          Score: {activeSeason.weatherScore}/10
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            Selected Travel Month:
            <strong className="text-white ml-1">
              {monthNames[parseInt(currentMonth, 10) - 1] || 'Current'}
            </strong>
          </span>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${crowdBadge}`}>
            {activeSeason.crowdLevel} Crowds
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {activeSeason.description}
        </p>
      </div>

      {/* 12-Month Suitability Bar */}
      {seasonProfile && (
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Annual Seasonality Matrix
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {monthNames.map((name, idx) => {
              const monthKey = String(idx + 1).padStart(2, '0');
              const data = seasonProfile[monthKey];
              const score = data?.weatherScore ?? 5;
              const isSelected = monthKey === currentMonth;

              let barBg = 'bg-rose-500/40 text-rose-300';
              if (score >= 8) barBg = 'bg-emerald-500/40 text-emerald-300';
              else if (score >= 6) barBg = 'bg-amber-500/40 text-amber-300';

              return (
                <div
                  key={name}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    isSelected
                      ? 'border-violet-400 bg-violet-600/30 ring-1 ring-violet-400'
                      : 'border-white/[0.05] bg-white/[0.02]'
                  }`}
                  title={`${name}: Score ${score}/10 (${data?.crowdLevel || 'Normal'} crowds)`}
                >
                  <div className="text-[10px] font-medium text-slate-400">{name}</div>
                  <div className={`text-xs font-bold mt-0.5 rounded py-0.5 ${barBg}`}>
                    {score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
