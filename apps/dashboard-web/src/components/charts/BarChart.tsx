'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn, formatTokens } from '@/lib/utils';
import { CHART_COLORS } from './chart-colors';
import { ChartTooltip } from './ChartTooltip';

export interface BarSeries {
  key: string;
  color?: string;
  name: string;
}

interface BarChartProps {
  data: Record<string, unknown>[];
  series: BarSeries[];
  xKey?: string;
  stacked?: boolean;
  horizontal?: boolean;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number, dataKey: string) => string;
  className?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  barRadius?: [number, number, number, number];
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

function formatDateLabel(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function defaultFormatYAxis(value: number): string {
  return formatTokens(value);
}

export function BarChart({
  data,
  series,
  xKey = 'name',
  stacked = false,
  horizontal = false,
  formatYAxis = defaultFormatYAxis,
  formatTooltip,
  className,
  height = 300,
  showGrid = true,
  showTooltip = true,
  barRadius = [4, 4, 0, 0],
  margin = { top: 5, right: 10, left: 0, bottom: 5 },
}: BarChartProps) {
  const isHorizontal = horizontal;

  return (
    <div className={cn('w-full overflow-hidden', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={margin}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border opacity-50"
            />
          )}

          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v: number) => formatYAxis(v)}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                width={80}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v: string) =>
                  xKey === 'date' ? formatDateLabel(v) : v
                }
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v: number) => formatYAxis(v)}
                width={45}
              />
            </>
          )}

          {showTooltip && (
            <Tooltip
              content={
                <ChartTooltip
                  formatValue={formatTooltip || ((v) => formatYAxis(v))}
                />
              }
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
            />
          )}

          {series.map((s, i) => {
            const color =
              s.color || CHART_COLORS.series[i % CHART_COLORS.series.length];
            return (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={color}
                stackId={stacked ? 'stack' : undefined}
                radius={stacked ? [0, 0, 0, 0] : barRadius}
                maxBarSize={48}
              />
            );
          })}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
