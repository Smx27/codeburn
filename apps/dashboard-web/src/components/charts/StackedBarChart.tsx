'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn, formatTokens, formatNumber } from '@/lib/utils';
import { CHART_COLORS } from './chart-colors';
import { ChartTooltip } from './ChartTooltip';

export interface StackedBarSeries {
  key: string;
  color?: string;
  name: string;
}

interface StackedBarChartProps {
  data: Record<string, unknown>[];
  series: StackedBarSeries[];
  xKey?: string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number, dataKey: string) => string;
  showTotal?: boolean;
  className?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
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

interface TotalLabelProps {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
  formatValue?: (value: number) => string;
}

function TotalLabel({ x, y, width, value, formatValue }: TotalLabelProps) {
  if (!value || !x || !width) return null;
  return (
    <text
      x={x + width / 2}
      y={y! - 8}
      textAnchor="middle"
      className="fill-muted-foreground text-xs font-medium"
    >
      {formatValue ? formatValue(value) : formatNumber(value)}
    </text>
  );
}

export function StackedBarChart({
  data,
  series,
  xKey = 'date',
  formatYAxis = defaultFormatYAxis,
  formatTooltip,
  showTotal = true,
  className,
  height = 300,
  showGrid = true,
  showTooltip = true,
  margin = { top: 20, right: 10, left: 0, bottom: 5 },
}: StackedBarChartProps) {
  const enrichedData = data.map((item) => {
    let total = 0;
    for (const s of series) {
      total += (item[s.key] as number) || 0;
    }
    return { ...item, _total: total };
  });

  return (
    <div className={cn('w-full overflow-hidden', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={enrichedData} margin={margin}>
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
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
            />
          )}

          {showTotal && (
            <Bar
              dataKey="_total"
              name="Total"
              stackId="stack"
              fill="transparent"
              label={
                <TotalLabel formatValue={(v) => formatYAxis(v)} />
              }
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
                stackId="stack"
                fill={color}
                radius={
                  i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                }
                maxBarSize={48}
              />
            );
          })}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
