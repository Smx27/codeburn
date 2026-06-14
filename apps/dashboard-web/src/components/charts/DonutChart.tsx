'use client';

import { useState, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { cn, formatNumber } from '@/lib/utils';

export interface DonutDataItem {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDataItem[];
  centerLabel?: string;
  centerValue?: string;
  formatValue?: (value: number) => string;
  className?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

function renderActiveShape(props: unknown) {
  const p = props as Record<string, unknown>;
  const cx = p.cx as number;
  const cy = p.cy as number;
  const innerRadius = p.innerRadius as number;
  const outerRadius = p.outerRadius as number;
  const startAngle = p.startAngle as number;
  const endAngle = p.endAngle as number;
  const fill = p.fill as string;
  const payload = p.payload as DonutDataItem;
  const value = p.value as number;

  return (
    <g>
          <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground text-sm font-medium">
            {formatNumber(value)}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground text-xs">
            {payload.name}
          </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={4}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 3}
        outerRadius={innerRadius - 1}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  formatValue = (v) => formatNumber(v),
  className,
  height = 300,
  innerRadius = 60,
  outerRadius = 90,
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn('flex flex-col items-center', className)} style={{ height }}>
      <div className="relative w-full" style={{ height: height - 70 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              dataKey="value"
              cornerRadius={4}
              paddingAngle={2}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="transition-opacity duration-200"
                  opacity={activeIndex === undefined || activeIndex === index ? 1 : 0.4}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {centerLabel && !activeIndex && activeIndex !== 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-semibold text-foreground">
              {centerValue || formatValue(total)}
            </span>
            <span className="text-xs text-muted-foreground">{centerLabel}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-2">
        {data.map((item, i) => (
          <div
            key={item.name}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-opacity duration-200',
              activeIndex !== undefined && activeIndex !== i && 'opacity-40'
            )}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-medium text-foreground tabular-nums">
              {formatValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
