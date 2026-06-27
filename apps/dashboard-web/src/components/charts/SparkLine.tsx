'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface SparkLineProps {
  data: number[];
  color?: string;
  className?: string;
  height?: number;
  gradient?: boolean;
}

let sparkCounter = 0;

export function SparkLine({
  data,
  color = 'hsl(var(--chart-1))',
  className,
  height = 40,
  gradient = true,
}: SparkLineProps) {
  const gradientId = useMemo(() => `sparkGrad-${++sparkCounter}`, []);

  const chartData = useMemo(
    () => data.map((value, index) => ({ index, value })),
    [data]
  );

  const trend = data.length >= 2 ? data[data.length - 1] - data[data.length - 2] : 0;
  const strokeColor = trend >= 0 ? color : 'hsl(var(--destructive))';

  return (
    <div className={cn('w-full overflow-hidden', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          {gradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}

          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={gradient ? `url(#${gradientId})` : 'transparent'}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
