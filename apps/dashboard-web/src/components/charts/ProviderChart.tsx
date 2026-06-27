'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { ProviderAnalytics } from '@/types/dashboard';
import { formatCurrency, formatTokens } from '@/lib/utils';

interface ProviderChartProps {
  data: ProviderAnalytics[];
  metric: 'sessions' | 'tokens' | 'cost';
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export function ProviderChart({ data, metric }: ProviderChartProps) {
  const getValue = (item: ProviderAnalytics) => {
    switch (metric) {
      case 'sessions':
        return item.totalSessions;
      case 'tokens':
        return item.totalTokens;
      case 'cost':
        return item.totalCost;
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

  const chartData = data.map((item) => ({
    name: item.providerName,
    value: getValue(item),
  }));

  return (
    <div className="w-full h-[300px] overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatValue(value)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}