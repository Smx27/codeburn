'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TrendPoint } from '@/types/dashboard';
import { formatCurrency, formatTokens } from '@/lib/utils';

interface TrendChartProps {
  data: TrendPoint[];
  metric: 'sessions' | 'tokens' | 'cost';
  title: string;
}

export function TrendChart({ data, metric, title }: TrendChartProps) {
  const getValue = (point: TrendPoint) => {
    switch (metric) {
      case 'sessions':
        return point.sessions;
      case 'tokens':
        return point.tokens;
      case 'cost':
        return point.cost;
    }
  };

  const formatValue = (value: number) => {
    switch (metric) {
      case 'sessions':
        return value.toLocaleString();
      case 'tokens':
        return formatTokens(value);
      case 'cost':
        return formatCurrency(value);
    }
  };

  const getColor = () => {
    switch (metric) {
      case 'sessions':
        return '#3b82f6';
      case 'tokens':
        return '#8b5cf6';
      case 'cost':
        return '#10b981';
    }
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={formatValue}
          />
          <Tooltip
            formatter={(value: number) => formatValue(value)}
            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          />
          <Line
            type="monotone"
            dataKey={metric}
            stroke={getColor()}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}