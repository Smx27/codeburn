'use client';

import { useMemo } from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn, formatTokens } from '@/lib/utils';
import { CHART_COLORS } from './chart-colors';
import { ChartTooltip } from './ChartTooltip';

export interface AreaSeries {
  key: string;
  color?: string;
  name: string;
  gradient?: boolean;
}

interface AreaChartProps {
  data: Record<string, unknown>[];
  series: AreaSeries[];
  xKey?: string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number, dataKey: string) => string;
  className?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

function formatDateLabel(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  if (diffDays < 365) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function defaultFormatYAxis(value: number): string {
  return formatTokens(value);
}

let gradientCounter = 0;

export function AreaChart({
  data,
  series,
  xKey = 'date',
  formatYAxis = defaultFormatYAxis,
  formatTooltip,
  className,
  height = 300,
  showGrid = true,
  showTooltip = true,
  stacked = false,
  margin = { top: 5, right: 10, left: 0, bottom: 5 },
}: AreaChartProps) {
  const gradientIds = useMemo(
    () => series.map(() => `areaGrad-${++gradientCounter}`),
    [series.length]
  );

  return (
    <div className={cn('w-full overflow-hidden', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={margin}
        >
          <defs>
            {series.map((s, i) => (
              <linearGradient
                key={gradientIds[i]}
                id={gradientIds[i]}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={s.color || CHART_COLORS.series[i % CHART_COLORS.series.length]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={s.color || CHART_COLORS.series[i % CHART_COLORS.series.length]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border opacity-50"
            />
          )}

          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v: string) => formatDateLabel(v)}
            dy={8}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v: number) => formatYAxis(v)}
            width={45}
          />

          {showTooltip && (
            <Tooltip
              content={
                <ChartTooltip
                  formatValue={formatTooltip || ((v, _dk) => formatYAxis(v))}
                />
              }
              cursor={{
                stroke: 'hsl(var(--muted-foreground))',
                strokeDasharray: '4 4',
                strokeOpacity: 0.3,
              }}
            />
          )}

          {series.map((s, i) => {
            const color = s.color || CHART_COLORS.series[i % CHART_COLORS.series.length];
            return (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientIds[i]})`}
                stackId={stacked ? 'stack' : undefined}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: color,
                  stroke: 'hsl(var(--card))',
                  strokeWidth: 2,
                }}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
