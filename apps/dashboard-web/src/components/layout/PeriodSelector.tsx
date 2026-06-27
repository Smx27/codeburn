'use client';

import { cn } from '@/lib/utils';
import type { Period } from '@/types/dashboard';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
  className?: string;
}

const periods: { value: Period; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '1y', label: '1y' },
];

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  return (
    <div className={cn('flex items-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5', className)}>
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            value === period.value
              ? 'bg-primary/15 text-primary border border-primary/30 shadow-glow-green'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
