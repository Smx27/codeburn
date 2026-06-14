import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface InsightCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

function InsightCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'hsl(var(--primary))',
  className,
}: InsightCardProps) {
  return (
    <div
      className={cn(
        'card-base group p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="rounded-lg p-2 shrink-0 transition-colors"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-lg font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export { InsightCard };
export type { InsightCardProps };
