'use client';

import { Select } from '@/components/ui/select';
import type { Period } from '@/types/dashboard';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

const periodOptions = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <Select
      options={periodOptions}
      value={value}
      onChange={(e) => onChange(e.target.value as Period)}
      className="w-[180px]"
    />
  );
}