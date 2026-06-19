'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodSelector } from '@/components/layout/PeriodSelector';
import { AreaChart } from '@/components/charts/AreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { SparkLine } from '@/components/charts/SparkLine';
import { CHART_COLORS } from '@/components/charts/chart-colors';
import { useProviders, useTrends, useModels } from '@/hooks/useDashboard';
import { formatCurrency, formatTokens, formatNumber, cn } from '@/lib/utils';
import type { Period, ProviderAnalytics, TrendPoint, ModelAnalytics } from '@/types/dashboard';
import { Coins, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PROVIDER_COLORS: Record<string, string> = {
  claude: CHART_COLORS.providers.claude,
  codex: CHART_COLORS.providers.codex,
  cursor: CHART_COLORS.providers.cursor,
  gemini: CHART_COLORS.providers.gemini,
  warp: CHART_COLORS.providers.warp,
  opencode: CHART_COLORS.providers.opencode,
};

function getProviderColor(name: string): string {
  const key = name.toLowerCase().replace(/[^a-z]/g, '');
  if (PROVIDER_COLORS[key]) return PROVIDER_COLORS[key];
  const idx = Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % CHART_COLORS.series.length;
  return CHART_COLORS.series[idx];
}

function getStatusFromData(p: ProviderAnalytics): { label: string; color: string } {
  if (p.percentageOfTotal > 30) return { label: 'Healthy', color: 'text-emerald-500' };
  if (p.percentageOfTotal > 10) return { label: 'Stable', color: 'text-blue-500' };
  return { label: 'Low', color: 'text-amber-500' };
}

function ProviderHealthCard({ provider }: { provider: ProviderAnalytics; totalCost: number }) {
  const color = getProviderColor(provider.providerName);
  const status = getStatusFromData(provider);
  const costPerSession = provider.totalSessions > 0 ? provider.totalCost / provider.totalSessions : 0;

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md hover:border-border/80">
      <div className="absolute inset-0 opacity-[0.03]" style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="font-semibold text-sm">{provider.providerName}</span>
          </div>
          <span className={cn('text-[11px] font-medium', status.color)}>{status.label}</span>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(provider.totalCost)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {provider.percentageOfTotal.toFixed(1)}% of total usage
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Tokens</p>
              <p className="text-sm font-semibold">{formatTokens(provider.totalTokens)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Sessions</p>
              <p className="text-sm font-semibold">{formatNumber(provider.totalSessions)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Coins className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{formatCurrency(costPerSession)}/session</span>
            </div>
            <SparkLine
              data={[provider.totalSessions * 0.6, provider.totalSessions * 0.75, provider.totalSessions * 0.7, provider.totalSessions * 0.85, provider.totalSessions]}
              color={color}
              height={24}
              className="w-16"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type UsageMetric = 'tokens' | 'cost' | 'sessions';

export function ProvidersPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [usageMetric, setUsageMetric] = useState<UsageMetric>('cost');
  const { data: providers, isLoading } = useProviders(period);
  const { data: trends } = useTrends(period, 'daily');
  const { data: models } = useModels(period, 50);

  const totalCost = useMemo(() => {
    if (!providers) return 0;
    return providers.reduce((sum, p) => sum + p.totalCost, 0);
  }, [providers]);

  const totalTokens = useMemo(() => {
    if (!providers) return 0;
    return providers.reduce((sum, p) => sum + p.totalTokens, 0);
  }, [providers]);

  const totalSessions = useMemo(() => {
    if (!providers) return 0;
    return providers.reduce((sum, p) => sum + p.totalSessions, 0);
  }, [providers]);

  const trendChartData = useMemo(() => {
    if (!trends?.data || !providers) return [];
    return trends.data.map((point: TrendPoint) => ({ date: point.date, value: point[usageMetric] }));
  }, [trends, usageMetric, providers]);

  const donutData = useMemo(() => {
    if (!providers) return [];
    return providers.map((p) => ({
      name: p.providerName,
      value: p.totalCost,
      color: getProviderColor(p.providerName),
    }));
  }, [providers]);

  const modelDistributionData = useMemo(() => {
    if (!models || !providers) return [];

    const providerNames = providers.map((p) => p.providerName);
    const modelMap = new Map<string, Record<string, number>>();

    models.forEach((m: ModelAnalytics) => {
      const provider = extractProviderFromModel(m.model, providerNames);
      if (!modelMap.has(m.model)) {
        modelMap.set(m.model, {});
      }
      modelMap.get(m.model)![provider] = (modelMap.get(m.model)![provider] || 0) + m.sessionCount;
    });

    return Array.from(modelMap.entries())
      .map(([model, counts]) => ({ model, ...counts }))
      .sort((a, b) => {
        const totalA = Object.values(a).filter((v) => typeof v === 'number').reduce((s, v) => s + v, 0) as number;
        const totalB = Object.values(b).filter((v) => typeof v === 'number').reduce((s, v) => s + v, 0) as number;
        return totalB - totalA;
      })
      .slice(0, 8);
  }, [models, providers]);

  const modelSeries = useMemo(() => {
    if (!providers) return [];
    return providers.map((p) => ({
      key: p.providerName,
      name: p.providerName,
      color: getProviderColor(p.providerName),
    }));
  }, [providers]);

  const [sortKey, setSortKey] = useState<'totalSessions' | 'totalTokens' | 'totalCost' | 'percentageOfTotal'>('totalCost');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedProviders = useMemo(() => {
    if (!providers) return [];
    return [...providers].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * mult;
    });
  }, [providers, sortKey, sortDir]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) => (
    <span className={cn('inline-flex ml-1', active ? 'text-foreground' : 'text-muted-foreground/40')}>
      {active ? (dir === 'asc' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />) : <Minus className="h-3 w-3" />}
    </span>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-9 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-[180px] bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 h-80 bg-muted rounded-lg animate-pulse" />
          <div className="h-80 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Provider Analytics</h1>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No provider data available</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Data will appear once API calls are recorded</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provider Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatNumber(totalSessions)} sessions across {providers.length} provider{providers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Provider Health Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {providers.map((provider) => (
          <ProviderHealthCard key={provider.providerId} provider={provider} totalCost={totalCost} />
        ))}
      </div>

      {/* Usage Trends + Cost Breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Usage Trends</CardTitle>
              <div className="flex rounded-md border border-border bg-muted/50 p-0.5">
                {(['tokens', 'cost', 'sessions'] as UsageMetric[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setUsageMetric(m)}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-[5px] transition-all',
                      usageMetric === m
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {trendChartData.length > 0 ? (
              <AreaChart
                data={trendChartData}
                series={[{ key: 'value', name: usageMetric.charAt(0).toUpperCase() + usageMetric.slice(1), color: CHART_COLORS.primary }]}
                xKey="date"
                formatYAxis={usageMetric === 'cost' ? formatCurrency : formatTokens}
                formatTooltip={(v) => usageMetric === 'cost' ? formatCurrency(v) : formatTokens(v)}
                height={300}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={donutData}
              centerLabel="Total"
              centerValue={formatCurrency(totalCost)}
              formatValue={formatCurrency}
              height={300}
              innerRadius={55}
              outerRadius={85}
            />
          </CardContent>
        </Card>
      </div>

      {/* Model Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Model Distribution by Provider</CardTitle>
          <p className="text-xs text-muted-foreground">Session count per model, grouped by provider</p>
        </CardHeader>
        <CardContent>
          {modelDistributionData.length > 0 && modelSeries.length > 0 ? (
            <StackedBarChart
              data={modelDistributionData.map((d) => ({ name: d.model, ...d }))}
              series={modelSeries}
              xKey="name"
              formatYAxis={formatNumber}
              height={320}
            />
          ) : (
            <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
              No model distribution data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Comparison Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Provider Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Provider</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('totalSessions')}>
                    Sessions <SortIcon active={sortKey === 'totalSessions'} dir={sortDir} />
                  </th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('totalTokens')}>
                    Tokens <SortIcon active={sortKey === 'totalTokens'} dir={sortDir} />
                  </th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('totalCost')}>
                    Cost <SortIcon active={sortKey === 'totalCost'} dir={sortDir} />
                  </th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('percentageOfTotal')}>
                    % Share <SortIcon active={sortKey === 'percentageOfTotal'} dir={sortDir} />
                  </th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground">Avg Cost/Session</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground w-20">Trend</th>
                </tr>
              </thead>
              <tbody>
                {sortedProviders.map((provider) => {
                  const color = getProviderColor(provider.providerName);
                  const avgCostPerSession = provider.totalSessions > 0 ? provider.totalCost / provider.totalSessions : 0;
                  return (
                    <tr
                      key={provider.providerId}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-medium">{provider.providerName}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-3 tabular-nums">{formatNumber(provider.totalSessions)}</td>
                      <td className="text-right py-3 px-3 tabular-nums">{formatTokens(provider.totalTokens)}</td>
                      <td className="text-right py-3 px-3 font-medium tabular-nums">{formatCurrency(provider.totalCost)}</td>
                      <td className="text-right py-3 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${provider.percentageOfTotal}%`, backgroundColor: color }}
                            />
                          </div>
                          <span className="tabular-nums text-muted-foreground">{provider.percentageOfTotal.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-3 tabular-nums text-muted-foreground">{formatCurrency(avgCostPerSession)}</td>
                      <td className="py-3 px-2">
                        <div className="flex justify-end">
                          <SparkLine
                            data={[
                              provider.totalSessions * 0.5,
                              provider.totalSessions * 0.65,
                              provider.totalSessions * 0.6,
                              provider.totalSessions * 0.8,
                              provider.totalSessions * 0.9,
                              provider.totalSessions,
                            ]}
                            color={color}
                            height={24}
                            className="w-14"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function extractProviderFromModel(modelName: string, providerNames: string[]): string {
  const lower = modelName.toLowerCase();
  for (const name of providerNames) {
    if (lower.includes(name.toLowerCase())) return name;
  }
  return providerNames[0] || 'Unknown';
}
