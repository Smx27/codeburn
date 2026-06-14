import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  sparklineData?: number[];
  iconColor?: string;
  className?: string;
}

function MiniSparkline({ data, color = 'hsl(var(--primary))' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  sparklineData,
  iconColor = 'hsl(var(--primary))',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'card-base group p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : trend.value === 0 ? (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.value === 0
                    ? 'text-muted-foreground'
                    : trend.isPositive
                    ? 'text-success'
                    : 'text-destructive'
                )}
              >
                {trend.value === 0 ? '0' : `${Math.abs(trend.value)}%`}
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className="rounded-lg p-2.5 transition-colors"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
          {sparklineData && sparklineData.length > 1 && (
            <MiniSparkline data={sparklineData} color={iconColor} />
          )}
        </div>
      </div>
    </div>
  );
}

export { MetricCard };
export type { MetricCardProps };
