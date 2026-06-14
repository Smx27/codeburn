'use client';

import { useMemo, useState } from 'react';
import { cn, formatNumber } from '@/lib/utils';

interface HeatmapDataPoint {
  date: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapDataPoint[];
  colorScale?: string[];
  className?: string;
  cellSize?: number;
  cellGap?: number;
  formatValue?: (value: number) => string;
}

const DEFAULT_COLOR_SCALE = [
  'hsl(var(--muted))',
  'hsl(var(--chart-1) / 0.15)',
  'hsl(var(--chart-1) / 0.35)',
  'hsl(var(--chart-1) / 0.6)',
  'hsl(var(--chart-1))',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DISPLAY_DAYS = [1, 3, 5];

function getWeeksFromData(data: HeatmapDataPoint[]) {
  if (!data.length) return [];

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstDate = new Date(sorted[0].date);
  const lastDate = new Date(sorted[sorted.length - 1].date);

  const startDate = new Date(firstDate);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: (HeatmapDataPoint | null)[][] = [];
  let currentWeek: (HeatmapDataPoint | null)[] = [];

  const dateMap = new Map(data.map((d) => [d.date, d]));
  const current = new Date(startDate);

  while (current <= lastDate || currentWeek.length > 0) {
    const dateStr = current.toISOString().split('T')[0];

    if (current.getDay() === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    const point = dateMap.get(dateStr) || null;
    if (current <= lastDate || currentWeek.length > 0) {
      currentWeek.push(point);
    }

    current.setDate(current.getDate() + 1);

    if (current > lastDate && current.getDay() === 0) break;
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function getMonthLabels(weeks: (HeatmapDataPoint | null)[][]): { label: string; index: number }[] {
  const labels: { label: string; index: number }[] = [];
  let lastMonth = -1;

  for (let i = 0; i < weeks.length; i++) {
    const firstDay = weeks[i].find((d) => d !== null);
    if (firstDay) {
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: new Date(firstDay.date).toLocaleDateString('en-US', { month: 'short' }),
          index: i,
        });
        lastMonth = month;
      }
    }
  }

  return labels;
}

export function HeatmapChart({
  data,
  colorScale = DEFAULT_COLOR_SCALE,
  className,
  cellSize = 14,
  cellGap = 3,
  formatValue = (v) => formatNumber(v),
}: HeatmapChartProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const weeks = useMemo(() => getWeeksFromData(data), [data]);
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.value), 1),
    [data]
  );

  const getColorIndex = (value: number): number => {
    if (value === 0) return 0;
    const ratio = value / maxValue;
    const index = Math.ceil(ratio * (colorScale.length - 1));
    return Math.min(index, colorScale.length - 1);
  };

  const totalWeeks = weeks.length;
  const svgWidth = totalWeeks * (cellSize + cellGap);
  const svgHeight = 7 * (cellSize + cellGap);

  return (
    <div className={cn('relative', className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-fit">
          <svg
            width={svgWidth + 30}
            height={svgHeight + 24}
            className="select-none"
          >
            {monthLabels.map((m, i) => (
              <text
                key={`${m.label}-${i}`}
                x={30 + m.index * (cellSize + cellGap)}
                y={12}
                className="fill-muted-foreground text-[10px]"
              >
                {m.label}
              </text>
            ))}

            {DAY_LABELS.map((day, i) =>
              DISPLAY_DAYS.includes(i) ? (
                <text
                  key={day}
                  x={0}
                  y={24 + i * (cellSize + cellGap) + cellSize / 2 + 3}
                  className="fill-muted-foreground text-[10px]"
                >
                  {day}
                </text>
              ) : null
            )}

            {weeks.map((week, weekIndex) =>
              week.map((day, dayIndex) => {
                if (!day) return null;

                const x = 30 + weekIndex * (cellSize + cellGap);
                const y = 20 + dayIndex * (cellSize + cellGap);
                const colorIndex = getColorIndex(day.value);

                return (
                  <g key={day.date}>
                    <rect
                      x={x}
                      y={y}
                      width={cellSize}
                      height={cellSize}
                      rx={2}
                      fill={colorScale[colorIndex]}
                      className="transition-opacity duration-150 hover:opacity-80 cursor-pointer"
                      onMouseEnter={(e) => {
                        const rect = (e.target as SVGRectElement).getBoundingClientRect();
                        setHoveredCell({
                          date: day.date,
                          value: day.value,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  </g>
                );
              })
            )}
          </svg>
        </div>
      </div>

      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: hoveredCell.x,
            top: hoveredCell.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="rounded-md border border-border bg-card px-2.5 py-1.5 shadow-lg">
            <p className="text-xs font-medium text-foreground">
              {formatValue(hoveredCell.value)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(hoveredCell.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center justify-end gap-1">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {colorScale.map((color, i) => (
          <rect
            key={i}
            width={cellSize - 4}
            height={cellSize - 4}
            rx={1.5}
            fill={color}
            className="inline-block"
          />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}
