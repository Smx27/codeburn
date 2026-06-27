'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodSelector } from '@/components/layout/PeriodSelector';
import { AreaChart } from '@/components/charts/AreaChart';
import { BarChart } from '@/components/charts/BarChart';
import { useProjects } from '@/hooks/useDashboard';
import { formatCurrency, formatTokens, formatNumber } from '@/lib/utils';
import { CHART_COLORS } from '@/components/charts/chart-colors';
import type { Period, ProjectAnalytics } from '@/types/dashboard';
import {
  Trophy,
  TrendingUp,
  FolderOpen,
  Users,
  Coins,
  Activity,
  BarChart3,
} from 'lucide-react';

const RANK_COLORS = [
  'bg-amber-500 text-white',
  'bg-slate-400 text-white',
  'bg-amber-700 text-white',
  'bg-muted text-muted-foreground',
  'bg-muted text-muted-foreground',
];

const PROJECT_COLORS = [
  CHART_COLORS.series[0],
  CHART_COLORS.series[1],
  CHART_COLORS.series[2],
  CHART_COLORS.series[3],
  CHART_COLORS.series[4],
];

function getStatusInfo(project: ProjectAnalytics, allProjects: ProjectAnalytics[]) {
  const avgSessions =
    allProjects.reduce((sum, p) => sum + p.sessionCount, 0) / allProjects.length;
  if (project.sessionCount >= avgSessions * 1.2) {
    return { label: 'Active', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
  }
  if (project.sessionCount >= avgSessions * 0.5) {
    return { label: 'Recent', color: 'bg-amber-500', textColor: 'text-amber-400' };
  }
  return { label: 'Inactive', color: 'bg-slate-500', textColor: 'text-slate-400' };
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      </div>
      <div className="h-3 bg-muted rounded w-full" />
      <div className="h-3 bg-muted rounded w-2/3" />
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

export function ProjectsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const { data: projects, isLoading } = useProjects(period, 20);

  const top5 = useMemo(() => (projects || []).slice(0, 5), [projects]);

  const costTrendData = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    const top = projects.slice(0, 5);
    const dates = new Set<string>();
    top.forEach((p) => {
      const pExt = p as unknown as Record<string, unknown>;
      if (pExt.trend) {
        (pExt.trend as Array<{ date: string }>).forEach((t) => dates.add(t.date));
      }
    });
    if (dates.size === 0) {
      return [{ name: 'Total', ...Object.fromEntries(top.map((p) => [p.projectName, p.cost])) }];
    }
    return Array.from(dates).sort().map((date) => {
      const entry: Record<string, unknown> = { date };
      top.forEach((p) => {
        const trend = (p as unknown as Record<string, unknown>).trend as
          | Array<{ date: string; cost: number }>
          | undefined;
        const point = trend?.find((t) => t.date === date);
        entry[p.projectName] = point?.cost ?? 0;
      });
      return entry;
    });
  }, [projects]);

  const tokenBarData = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    return projects.slice(0, 8).map((p) => ({
      name: p.projectName.length > 12 ? p.projectName.slice(0, 12) + '...' : p.projectName,
      tokens: p.tokenCount,
      sessions: p.sessionCount,
    }));
  }, [projects]);

  const comparisonData = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    return projects.slice(0, 6).map((p) => ({
      name: p.projectName.length > 10 ? p.projectName.slice(0, 10) + '...' : p.projectName,
      cost: p.cost,
      sessions: p.sessionCount,
    }));
  }, [projects]);

  const costTrendSeries = useMemo(
    () =>
      top5.map((p, i) => ({
        key: p.projectName,
        name: p.projectName,
        color: PROJECT_COLORS[i],
      })),
    [top5]
  );

  const totalCost = useMemo(
    () => (projects || []).reduce((sum, p) => sum + p.cost, 0),
    [projects]
  );
  const totalSessions = useMemo(
    () => (projects || []).reduce((sum, p) => sum + p.sessionCount, 0),
    [projects]
  );
  const totalTokens = useMemo(
    () => (projects || []).reduce((sum, p) => sum + p.tokenCount, 0),
    [projects]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
          <p className="text-sm text-white/40">
            Cost analytics and usage breakdowns across your projects
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Projects',
            value: formatNumber(projects?.length ?? 0),
            icon: FolderOpen,
          },
          {
            label: 'Total Cost',
            value: formatCurrency(totalCost),
            icon: Coins,
          },
          {
            label: 'Total Sessions',
            value: formatNumber(totalSessions),
            icon: Users,
          },
          {
            label: 'Total Tokens',
            value: formatTokens(totalTokens),
            icon: Activity,
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-white/[0.06] bg-white/[0.02]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-white">
                    {isLoading ? (
                      <span className="inline-block h-7 w-20 animate-pulse rounded bg-white/[0.05]" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-white/[0.05] p-2">
                  <stat.icon className="h-4 w-4 text-white/40" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h2 className="text-lg font-semibold">Top 5 Projects by Cost</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : top5.map((project, i) => (
                <Card key={project.projectName} className="relative overflow-hidden border-white/[0.06] bg-white/[0.02]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${RANK_COLORS[i]}`}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-white/80" title={project.projectName}>
                            {project.projectName}
                          </p>
                          <p className="text-xs text-white/40">
                            {formatCurrency(project.cost)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span className="text-white/40">Sessions</span>
                        <span className="font-medium text-white/80">
                          {formatNumber(project.sessionCount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Tokens</span>
                        <span className="font-medium text-white/80">
                          {formatTokens(project.tokenCount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Avg / Session</span>
                        <span className="font-medium text-white/80">
                          {formatCurrency(
                            project.sessionCount > 0
                              ? project.cost / project.sessionCount
                              : 0
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  {i === 0 && (
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />
                  )}
                </Card>
              ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-base text-white/80">Project Cost Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonChart />
            ) : costTrendData.length > 0 ? (
              <AreaChart
                data={costTrendData}
                series={costTrendSeries}
                formatYAxis={formatCurrency}
                formatTooltip={(v) => formatCurrency(v)}
                height={320}
                stacked
              />
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <TrendingUp className="h-8 w-8 opacity-40" />
                <p>No trend data available for the selected period</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-base text-white/80">Token Usage by Project</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonChart />
            ) : tokenBarData.length > 0 ? (
              <BarChart
                data={tokenBarData}
                series={[{ key: 'tokens', name: 'Tokens', color: CHART_COLORS.series[1] }]}
                formatYAxis={formatTokens}
                formatTooltip={(v) => formatTokens(v)}
                height={320}
                horizontal
              />
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Activity className="h-8 w-8 opacity-40" />
                <p>No token data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-base text-white/80">Project Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-3 px-2 font-medium text-white/40">Project</th>
                      <th className="text-right py-3 px-2 font-medium text-white/40">Sessions</th>
                      <th className="text-right py-3 px-2 font-medium text-white/40">Tokens</th>
                      <th className="text-right py-3 px-2 font-medium text-white/40">Cost</th>
                      <th className="text-right py-3 px-2 font-medium text-white/40">Avg Session</th>
                      <th className="text-center py-3 px-2 font-medium text-white/40">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project, i) => {
                    const status = getStatusInfo(project, projects);
                    return (
                      <tr
                        key={project.projectName}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-muted text-muted-foreground"
                            >
                              {i + 1}
                            </span>
                            <span className="font-medium truncate max-w-[180px]" title={project.projectName}>
                              {project.projectName}
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2 tabular-nums">
                          {formatNumber(project.sessionCount)}
                        </td>
                        <td className="text-right py-3 px-2 tabular-nums">
                          {formatTokens(project.tokenCount)}
                        </td>
                        <td className="text-right py-3 px-2 tabular-nums font-medium">
                          {formatCurrency(project.cost)}
                        </td>
                        <td className="text-right py-3 px-2 tabular-nums text-muted-foreground">
                          {formatCurrency(
                            project.sessionCount > 0
                              ? project.cost / project.sessionCount
                              : 0
                          )}
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className={`h-1.5 w-1.5 rounded-full ${status.color}`} />
                            <span className={status.textColor}>{status.label}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground gap-2">
              <FolderOpen className="h-8 w-8 opacity-40" />
              <p>No project data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-base text-white/80">Project Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonChart />
          ) : comparisonData.length > 0 ? (
            <BarChart
              data={comparisonData}
              series={[
                { key: 'cost', name: 'Cost ($)', color: CHART_COLORS.series[0] },
                { key: 'sessions', name: 'Sessions', color: CHART_COLORS.series[2] },
              ]}
              formatYAxis={(v) => (v >= 1 ? formatCurrency(v) : formatNumber(v))}
              formatTooltip={(v, dk) =>
                dk === 'cost' ? formatCurrency(v) : formatNumber(v)
              }
              height={320}
            />
          ) : (
            <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground gap-2">
              <BarChart3 className="h-8 w-8 opacity-40" />
              <p>No comparison data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
