'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn, formatTokens } from '@/lib/utils';
import { CHART_COLORS } from './chart-colors';
import { ChartTooltip } from './ChartTooltip';

export interface LineSeries {
  key: string;
  color?: string;
  name: string;
  dashed?: boolean;
}

interface LineChartProps {
  data: Record<string, unknown>[];
  series: LineSeries[];
  xKey?: string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number, dataKey: string) => string;
  className?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  dot?: boolean;
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

export function LineChart({
  data,
  series,
  xKey = 'date',
  formatYAxis = defaultFormatYAxis,
  formatTooltip,
  className,
  height = 300,
  showGrid = true,
  showTooltip = true,
  dot = false,
  margin = { top: 5, right: 10, left: 0, bottom: 5 },
}: LineChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={margin}>
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
                  formatValue={formatTooltip || ((v) => formatYAxis(v))}
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
            const color =
              s.color || CHART_COLORS.series[i % CHART_COLORS.series.length];
            return (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={color}
                strokeWidth={2}
                dot={dot}
                activeDot={{
                  r: 4,
                  fill: color,
                  stroke: 'hsl(var(--card))',
                  strokeWidth: 2,
                }}
                strokeDasharray={s.dashed ? '6 4' : undefined}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            );
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
