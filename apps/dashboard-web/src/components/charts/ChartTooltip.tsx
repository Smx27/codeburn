'use client';

import { cn } from '@/lib/utils';

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
  dataKey: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatValue?: (value: number, dataKey: string) => string;
  className?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
  className,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card px-3 py-2',
        'shadow-lg backdrop-blur-sm',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
    >
      {label && (
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="ml-auto font-medium text-foreground tabular-nums">
              {formatValue
                ? formatValue(item.value, item.dataKey)
                : item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
