import type { Confidence } from '@/lib/types';
import { ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';

interface Props {
  confidence: Confidence;
  score?: number;
  showTooltip?: boolean;
}

export default function ConfidenceBadge({ confidence, score }: Props) {
  const configs = {
    HIGH: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: ShieldCheck,
      label: 'High Confidence',
      description: 'Historical routes + verified transit rates within 5-10% accuracy',
    },
    MEDIUM: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: AlertTriangle,
      label: 'Medium Confidence',
      description: 'Synthetic model estimates, subject to seasonal volatility',
    },
    LOW: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      icon: HelpCircle,
      label: 'Low Confidence',
      description: 'Limited transit data or dynamic surge pricing likely',
    },
  };

  const current = configs[confidence] || configs.MEDIUM;
  const Icon = current.icon;

  return (
    <div
      title={current.description}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} shadow-sm backdrop-blur-sm cursor-help transition-transform hover:scale-105`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{current.label}</span>
      {score !== undefined && (
        <span className="opacity-75 text-[10px] ml-0.5">({score}%)</span>
      )}
    </div>
  );
}
