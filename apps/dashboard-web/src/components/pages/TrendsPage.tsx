'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodSelector } from '@/components/layout/PeriodSelector';
import { AreaChart } from '@/components/charts/AreaChart';
import { useTrends } from '@/hooks/useDashboard';
import { formatCurrency, formatTokens, formatNumber } from '@/lib/utils';
import { CHART_COLORS } from '@/components/charts/chart-colors';
import type { Period, TrendPoint } from '@/types/dashboard';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Coins,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const GRANULARITY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

type Granularity = 'daily' | 'weekly' | 'monthly';

interface MetricCard {
  label: string;
  value: number;
  prevValue: number;
  format: (v: number) => string;
  icon: typeof TrendingUp;
  color: string;
}

function computeChange(current: number, previous: number) {
  if (previous === 0) return { change: current, changePercent: current > 0 ? 100 : 0 };
  const change = current - previous;
  const changePercent = (change / previous) * 100;
  return { change, changePercent };
}

function TrendArrow({ value }: { value: number }) {
  if (value > 0) return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />;
  if (value < 0) return <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
      <div className="h-3 bg-muted rounded w-20" />
      <div className="h-7 bg-muted rounded w-28" />
      <div className="h-3 bg-muted rounded w-16" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4 animate-pulse">
      <div className="h-5 bg-muted rounded w-40" />
      <div className="h-[300px] bg-muted/50 rounded" />
    </div>
  );
}

export function TrendsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const { data: trends, isLoading } = useTrends(period, granularity);

  const data = useMemo(() => trends?.data || [], [trends]);

  const metrics = useMemo<MetricCard[]>(() => {
    if (data.length === 0) {
      return [
        { label: 'Sessions', value: 0, prevValue: 0, format: formatNumber, icon: Users, color: CHART_COLORS.series[0] },
        { label: 'Tokens', value: 0, prevValue: 0, format: formatTokens, icon: Activity, color: CHART_COLORS.series[1] },
        { label: 'Cost', value: 0, prevValue: 0, format: formatCurrency, icon: Coins, color: CHART_COLORS.series[2] },
      ];
    }
    const mid = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, mid);
    const secondHalf = data.slice(mid);

    const sumSessions = (arr: TrendPoint[]) => arr.reduce((s, d) => s + d.sessions, 0);
    const sumTokens = (arr: TrendPoint[]) => arr.reduce((s, d) => s + d.tokens, 0);
    const sumCost = (arr: TrendPoint[]) => arr.reduce((s, d) => s + d.cost, 0);

    const sessionsCurrent = sumSessions(secondHalf);
    const sessionsPrev = sumSessions(firstHalf);
    const tokensCurrent = sumTokens(secondHalf);
    const tokensPrev = sumTokens(firstHalf);
    const costCurrent = sumCost(secondHalf);
    const costPrev = sumCost(firstHalf);

    return [
      {
        label: 'Sessions',
        value: sessionsCurrent,
        prevValue: sessionsPrev,
        format: formatNumber,
        icon: Users,
        color: CHART_COLORS.series[0],
      },
      {
        label: 'Tokens',
        value: tokensCurrent,
        prevValue: tokensPrev,
        format: formatTokens,
        icon: Activity,
        color: CHART_COLORS.series[1],
      },
      {
        label: 'Cost',
        value: costCurrent,
        prevValue: costPrev,
        format: formatCurrency,
        icon: Coins,
        color: CHART_COLORS.series[2],
      },
    ];
  }, [data]);

  const multiSeriesData = useMemo(() => {
    return data.map((d) => ({
      date: d.date,
      Sessions: d.sessions,
      Tokens: d.tokens,
      Cost: d.cost,
    }));
  }, [data]);

  const [activeSeries, setActiveSeries] = useState<string[]>(['Sessions', 'Tokens', 'Cost']);

  const toggleSeries = (series: string) => {
    setActiveSeries((prev) =>
      prev.includes(series) ? prev.filter((s) => s !== series) : [...prev, series]
    );
  };

  const sessionsData = useMemo(
    () => data.map((d) => ({ date: d.date, sessions: d.sessions })),
    [data]
  );
  const tokensData = useMemo(
    () => data.map((d) => ({ date: d.date, tokens: d.tokens })),
    [data]
  );
  const costData = useMemo(
    () => data.map((d) => ({ date: d.date, cost: d.cost })),
    [data]
  );

  const weekComparison = useMemo(() => {
    if (data.length < 14) return null;
    const last7 = data.slice(-7);
    const prev7 = data.slice(-14, -7);
    const sumField = (arr: TrendPoint[], key: keyof TrendPoint) =>
      arr.reduce((s, d) => s + (d[key] as number), 0);
    return {
      current: {
        sessions: sumField(last7, 'sessions'),
        tokens: sumField(last7, 'tokens'),
        cost: sumField(last7, 'cost'),
        label: 'This Week',
      },
      previous: {
        sessions: sumField(prev7, 'sessions'),
        tokens: sumField(prev7, 'tokens'),
        cost: sumField(prev7, 'cost'),
        label: 'Last Week',
      },
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Trends</h1>
          <p className="text-sm text-muted-foreground">
            Track usage patterns, cost trajectories, and week-over-week changes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
            {GRANULARITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGranularity(opt.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  granularity === opt.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const { change, changePercent } = computeChange(metric.value, metric.prevValue);
          return (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {isLoading ? (
                        <span className="inline-block h-7 w-24 animate-pulse rounded bg-muted" />
                      ) : (
                        metric.format(metric.value)
                      )}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {isLoading ? (
                        <span className="inline-block h-3 w-16 animate-pulse rounded bg-muted" />
                      ) : (
                        <>
                          <TrendArrow value={change} />
                          <span
                            className={`text-xs font-medium ${
                              change > 0
                                ? 'text-emerald-400'
                                : change < 0
                                ? 'text-red-400'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {change > 0 ? '+' : ''}
                            {metric.format(change)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({changePercent > 0 ? '+' : ''}
                            {changePercent.toFixed(1)}%)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-2"
                    style={{ backgroundColor: `${metric.color}15` }}
                  >
                    <metric.icon className="h-4 w-4" style={{ color: metric.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Metrics</CardTitle>
            <div className="flex items-center gap-2">
              {['Sessions', 'Tokens', 'Cost'].map((series) => (
                <button
                  key={series}
                  onClick={() => toggleSeries(series)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                    activeSeries.includes(series)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {series}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonChart />
          ) : data.length > 0 ? (
            <AreaChart
              data={multiSeriesData}
              series={[
                { key: 'Sessions', name: 'Sessions', color: CHART_COLORS.series[0] },
                { key: 'Tokens', name: 'Tokens', color: CHART_COLORS.series[1] },
                { key: 'Cost', name: 'Cost', color: CHART_COLORS.series[2] },
              ].filter((s) => activeSeries.includes(s.name))}
              formatYAxis={formatTokens}
              formatTooltip={(v, dk) =>
                dk === 'Cost' ? formatCurrency(v) : dk === 'Sessions' ? formatNumber(v) : formatTokens(v)
              }
              height={350}
            />
          ) : (
            <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Calendar className="h-8 w-8 opacity-40" />
              <p>No trend data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessions Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonChart />
            ) : sessionsData.length > 0 ? (
              <AreaChart
                data={sessionsData}
                series={[{ key: 'sessions', name: 'Sessions', color: CHART_COLORS.series[0] }]}
                formatYAxis={formatNumber}
                formatTooltip={(v) => formatNumber(v)}
                height={280}
              />
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No sessions data
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Token Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonChart />
            ) : tokensData.length > 0 ? (
              <AreaChart
                data={tokensData}
                series={[{ key: 'tokens', name: 'Tokens', color: CHART_COLORS.series[1] }]}
                formatYAxis={formatTokens}
                formatTooltip={(v) => formatTokens(v)}
                height={280}
              />
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No token data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonChart />
          ) : costData.length > 0 ? (
            <AreaChart
              data={costData}
              series={[{ key: 'cost', name: 'Cost', color: CHART_COLORS.series[2] }]}
              formatYAxis={formatCurrency}
              formatTooltip={(v) => formatCurrency(v)}
              height={300}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No cost data
            </div>
          )}
        </CardContent>
      </Card>

      {weekComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Week-over-Week Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: 'Sessions', key: 'sessions' as const, format: formatNumber },
                { label: 'Tokens', key: 'tokens' as const, format: formatTokens },
                { label: 'Cost', key: 'cost' as const, format: formatCurrency },
              ].map((metric) => {
                const curr = weekComparison.current[metric.key];
                const prev = weekComparison.previous[metric.key];
                const { change, changePercent } = computeChange(curr, prev);
                return (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-border/50 p-4 space-y-3"
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {metric.label}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">This Week</p>
                        <p className="text-lg font-bold">{metric.format(curr)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Last Week</p>
                        <p className="text-lg font-bold text-muted-foreground">{metric.format(prev)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendArrow value={change} />
                      <span
                        className={`text-xs font-medium ${
                          change > 0
                            ? 'text-emerald-400'
                            : change < 0
                            ? 'text-red-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {change > 0 ? '+' : ''}
                        {changePercent.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground">vs last week</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
