'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodSelector } from '@/components/PeriodSelector';
import { DonutChart } from '@/components/charts/DonutChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { useModels } from '@/hooks/useDashboard';
import { formatCurrency, formatTokens, formatNumber } from '@/lib/utils';
import { CHART_COLORS } from '@/components/charts/chart-colors';
import type { Period, ModelAnalytics } from '@/types/dashboard';
import {
  Cpu,
  Coins,
  Activity,
  Users,
  BarChart3,
  Zap,
  TrendingUp,
  Crown,
} from 'lucide-react';

const PROVIDER_MAP: Record<string, { label: string; color: string }> = {
  openai: { label: 'OpenAI', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  anthropic: { label: 'Anthropic', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  google: { label: 'Google', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  cohere: { label: 'Cohere', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  mistral: { label: 'Mistral', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  meta: { label: 'Meta', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
};

function getProviderInfo(modelName: string) {
  const lower = modelName.toLowerCase();
  if (lower.includes('gpt') || lower.includes('o1') || lower.includes('o3') || lower.includes('davinci'))
    return PROVIDER_MAP.openai;
  if (lower.includes('claude') || lower.includes('sonnet') || lower.includes('haiku') || lower.includes('opus'))
    return PROVIDER_MAP.anthropic;
  if (lower.includes('gemini') || lower.includes('palm') || lower.includes('bison'))
    return PROVIDER_MAP.google;
  if (lower.includes('command') || lower.includes('c4'))
    return PROVIDER_MAP.cohere;
  if (lower.includes('mistral') || lower.includes('mixtral'))
    return PROVIDER_MAP.mistral;
  if (lower.includes('llama') || lower.includes('codellama'))
    return PROVIDER_MAP.meta;
  return { label: 'Unknown', color: 'bg-muted text-muted-foreground border-border' };
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-28" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      </div>
      <div className="h-3 bg-muted rounded w-full" />
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

export function ModelsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const { data: models, isLoading } = useModels(period, 20);

  const top6 = useMemo(() => (models || []).slice(0, 6), [models]);

  const donutData = useMemo(() => {
    if (!models || models.length === 0) return [];
    return models.slice(0, 8).map((m, i) => ({
      name: m.model,
      value: m.totalCost,
      color: CHART_COLORS.models[i % CHART_COLORS.models.length],
    }));
  }, [models]);

  const usageTrendData = useMemo(() => {
    if (!models || models.length === 0) return [];
    const top = models.slice(0, 5);
    const sample = top[0] as unknown as Record<string, unknown>;
    const trend = sample?.trend as Array<Record<string, unknown>> | undefined;
    if (trend && trend.length > 0) {
      return trend.map((point) => {
        const entry: Record<string, unknown> = { date: point.date };
        top.forEach((m) => {
          entry[m.model] = (point[m.model] as number) ?? 0;
        });
        return entry;
      });
    }
    return [{ name: 'Total', ...Object.fromEntries(top.map((m) => [m.model, m.totalCost])) }];
  }, [models]);

  const usageTrendSeries = useMemo(
    () =>
      top6.map((m, i) => ({
        key: m.model,
        name: m.model,
        color: CHART_COLORS.models[i % CHART_COLORS.models.length],
      })),
    [top6]
  );

  const totalCost = useMemo(
    () => (models || []).reduce((sum, m) => sum + m.totalCost, 0),
    [models]
  );
  const totalTokens = useMemo(
    () => (models || []).reduce((sum, m) => sum + m.totalTokens, 0),
    [models]
  );
  const totalSessions = useMemo(
    () => (models || []).reduce((sum, m) => sum + m.sessionCount, 0),
    [models]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Models</h1>
          <p className="text-sm text-muted-foreground">
            Model usage analytics, cost distribution, and provider breakdown
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Models', value: formatNumber(models?.length ?? 0), icon: Cpu },
          { label: 'Total Cost', value: formatCurrency(totalCost), icon: Coins },
          { label: 'Total Tokens', value: formatTokens(totalTokens), icon: Activity },
          { label: 'Total Sessions', value: formatNumber(totalSessions), icon: Users },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {isLoading ? (
                      <span className="inline-block h-7 w-20 animate-pulse rounded bg-muted" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          <h2 className="text-lg font-semibold">Top Models</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : top6.map((model, i) => {
                const provider = getProviderInfo(model.model);
                const avgTokensPerSession =
                  model.sessionCount > 0
                    ? Math.round(model.totalTokens / model.sessionCount)
                    : 0;
                return (
                  <Card key={model.model} className="relative overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                            style={{
                              backgroundColor: `${CHART_COLORS.models[i % CHART_COLORS.models.length]}20`,
                              color: CHART_COLORS.models[i % CHART_COLORS.models.length],
                            }}
                          >
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" title={model.model}>
                              {model.model}
                            </p>
                            <span
                              className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${provider.color}`}
                            >
                              {provider.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Cost</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(model.totalCost)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tokens</span>
                          <span className="font-medium text-foreground">
                            {formatTokens(model.totalTokens)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sessions</span>
                          <span className="font-medium text-foreground">
                            {formatNumber(model.sessionCount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tokens / Session</span>
                          <span className="font-medium text-foreground">
                            {formatTokens(avgTokensPerSession)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    {i === 0 && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />
                    )}
                  </Card>
                );
              })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonChart />
            ) : donutData.length > 0 ? (
              <DonutChart
                data={donutData}
                centerLabel="Total Cost"
                centerValue={formatCurrency(totalCost)}
                formatValue={(v) => formatCurrency(v)}
                height={320}
              />
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Coins className="h-8 w-8 opacity-40" />
                <p>No model cost data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonChart />
            ) : usageTrendData.length > 0 ? (
              <StackedBarChart
                data={usageTrendData}
                series={usageTrendSeries}
                formatYAxis={formatCurrency}
                formatTooltip={(v) => formatCurrency(v)}
                height={320}
              />
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <TrendingUp className="h-8 w-8 opacity-40" />
                <p>No usage trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : models && models.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Rank</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Model</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Provider</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Sessions</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Tokens</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Cost</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">% Share</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Avg Tokens</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Cost / Session</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model, i) => {
                    const provider = getProviderInfo(model.model);
                    const avgTokensPerSession =
                      model.sessionCount > 0
                        ? Math.round(model.totalTokens / model.sessionCount)
                        : 0;
                    const costPerSession =
                      model.sessionCount > 0 ? model.totalCost / model.sessionCount : 0;
                    return (
                      <tr
                        key={model.model}
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                              i < 3
                                ? 'bg-primary/15 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-medium" title={model.model}>
                            {model.model}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${provider.color}`}
                          >
                            {provider.label}
                          </span>
                        </td>
                        <td className="text-right py-3 px-2 tabular-nums">
                          {formatNumber(model.sessionCount)}
                        </td>
                        <td className="text-right py-3 px-2 tabular-nums">
                          {formatTokens(model.totalTokens)}
                        </td>
                        <td className="text-right py-3 px-2 tabular-nums font-medium">
                          {formatCurrency(model.totalCost)}
                        </td>
                        <td className="text-right py-3 px-2 tabular-nums">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${model.percentageOfTotal}%` }}
                              />
                            </div>
                            <span className="text-muted-foreground w-10 text-right">
                              {model.percentageOfTotal.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2 tabular-nums text-muted-foreground">
                          {formatTokens(avgTokensPerSession)}
                        </td>
                        <td className="text-right py-3 px-2 tabular-nums text-muted-foreground">
                          {formatCurrency(costPerSession)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Cpu className="h-8 w-8 opacity-40" />
              <p>No model data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
