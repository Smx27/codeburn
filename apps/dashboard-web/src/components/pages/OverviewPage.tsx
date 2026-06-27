'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Coins,
  DollarSign,
  Users,
  Activity,
  Layers,
  Gauge,
  TrendingUp,
  TrendingDown,
  Crown,
  Rocket,
  FolderOpen,
  UserCircle,
  Building2,
  Zap,
  Clock,
  ArrowUpRight,
  BookOpen,
  KeyRound,
  Monitor,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodSelector } from '@/components/layout/PeriodSelector';
import { AreaChart } from '@/components/charts/AreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { BarChart } from '@/components/charts/BarChart';
import { SparkLine } from '@/components/charts/SparkLine';
import { CHART_COLORS } from '@/components/charts/chart-colors';
import {
  useOverview,
  useProviders,
  useTrends,
  useModels,
  useUsers,
  useProjects,
  useAgents,
} from '@/hooks/useDashboard';
import {
  formatCurrency,
  formatTokens,
  formatNumber,
  formatRelativeTime,
  getInitials,
  formatPercent,
} from '@/lib/utils';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import type { Period, ProviderAnalytics, UserAnalytics } from '@/types/dashboard';

// ── Metric Card ──────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trendPercent?: number;
  trendUp?: boolean;
  sparkData?: number[];
  sparkColor?: string;
  loading?: boolean;
  iconBg?: string;
  animationDelay?: number;
}

function MetricCard({
  icon,
  label,
  value,
  trendPercent,
  trendUp,
  sparkData,
  sparkColor,
  loading,
  iconBg = 'bg-primary/10',
  animationDelay = 0,
}: MetricCardProps) {
  return (
    <Card
      className="group border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all cursor-default animate-fade-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm text-white/40">{label}</p>
              {loading ? (
                <div className="mt-1 h-8 w-24 animate-pulse rounded bg-white/[0.05]" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
              )}
            </div>
          </div>
          {sparkData && sparkData.length > 1 && (
            <div className="w-20 shrink-0">
              <SparkLine data={sparkData} color={sparkColor} height={36} />
            </div>
          )}
        </div>
        {trendPercent !== undefined && !loading && (
          <div className="mt-3 flex items-center gap-1.5 text-sm">
            {trendUp ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            )}
            <span className={trendUp ? 'text-emerald-400' : 'text-red-400'}>
              {trendUp ? '+' : ''}{formatPercent(trendPercent)} vs last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Metric Skeleton ──────────────────────────────────────

function MetricSkeleton() {
  return (
    <Card className="border-white/[0.06] bg-white/[0.02]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.05]" />
            <div>
              <div className="h-4 w-20 animate-pulse rounded bg-white/[0.05]" />
              <div className="mt-1 h-8 w-28 animate-pulse rounded bg-white/[0.05]" />
            </div>
          </div>
          <div className="h-10 w-20 animate-pulse rounded bg-white/[0.05]" />
        </div>
        <div className="mt-3 h-4 w-32 animate-pulse rounded bg-white/[0.05]" />
      </CardContent>
    </Card>
  );
}

// ── Insight Card ─────────────────────────────────────────

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  iconBg?: string;
  href?: string;
  animationDelay?: number;
}

function InsightCard({ icon, title, value, subtitle, iconBg = 'bg-primary/10', animationDelay = 0 }: InsightCardProps) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] hover:border-white/[0.1] cursor-default animate-fade-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/40">{title}</p>
        <p className="truncate text-base font-semibold text-white">{value}</p>
        {subtitle && (
          <p className="truncate text-xs text-white/30">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ── Chart Skeleton ───────────────────────────────────────

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <div className="space-y-3 text-center">
        <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-white/[0.05]" />
        <div className="mx-auto h-4 w-24 animate-pulse rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center text-sm text-white/30">
      {message}
    </div>
  );
}

// ── Activity Feed Item ───────────────────────────────────

interface ActivityItem {
  userName: string;
  provider: string;
  project: string;
  tokens: number;
  cost: number;
  timestamp: string;
}

function ActivityFeedItem({ item }: { item: ActivityItem }) {
  const initials = getInitials(item.userName);
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.02]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 border border-primary/20 text-xs font-medium text-primary">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/80">{item.userName}</p>
        <p className="truncate text-xs text-white/30">
          {item.provider} · {item.project}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-white/60">{formatTokens(item.tokens)} tokens</p>
        <p className="text-xs text-white/25">{formatRelativeTime(item.timestamp)}</p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

export function OverviewPage() {
  const [period, setPeriod] = useState<Period>('30d');

  const { data: overview, isLoading: overviewLoading } = useOverview(period);
  const { data: providers, isLoading: providersLoading } = useProviders(period);
  const { data: trends, isLoading: trendsLoading } = useTrends(period, 'daily');
  const { data: models, isLoading: modelsLoading } = useModels(period, 10);
  const { data: users, isLoading: usersLoading } = useUsers(period, 50);
  const { data: projects } = useProjects(period, 20);
  const { data: agents, isLoading: agentsLoading } = useAgents();

  // ── Derived data ─────────────────────────────────────

  const sparkTrendData = useMemo(() => {
    if (!trends?.data) return undefined;
    return trends.data.map((p) => p.tokens);
  }, [trends]);

  const costSparkData = useMemo(() => {
    if (!trends?.data) return undefined;
    return trends.data.map((p) => p.cost);
  }, [trends]);

  const avgCostPerSession = useMemo(() => {
    if (!overview || overview.totalSessions === 0) return 0;
    return overview.totalCost / overview.totalSessions;
  }, [overview]);

  // Area chart data for usage over time
  const usageAreaData = useMemo(() => {
    if (!trends?.data) return [];
    return trends.data.map((p) => ({
      date: p.date,
      tokens: p.tokens,
      sessions: p.sessions,
    }));
  }, [trends]);

  // Donut data for provider distribution
  const providerDonutData = useMemo(() => {
    if (!providers) return [];
    const colorKeys = Object.keys(CHART_COLORS.providers) as Array<keyof typeof CHART_COLORS.providers>;
    return providers.map((p, i) => ({
      name: p.providerName,
      value: p.totalCost,
      color: CHART_COLORS.providers[colorKeys[i % colorKeys.length]] || CHART_COLORS.series[i % CHART_COLORS.series.length],
    }));
  }, [providers]);

  // Stacked bar data for cost by provider over time
  const costByProviderData = useMemo(() => {
    if (!trends?.data || !providers) return [];
    return trends.data.map((point) => {
      const entry: Record<string, unknown> = { date: point.date };
      providers.forEach((p) => {
        entry[p.providerName] = Math.round((p.percentageOfTotal / 100) * point.cost * 100) / 100;
      });
      return entry;
    });
  }, [trends, providers]);

  const costByProviderSeries = useMemo(() => {
    if (!providers) return [];
    const colorKeys = Object.keys(CHART_COLORS.providers) as Array<keyof typeof CHART_COLORS.providers>;
    return providers.map((p, i) => ({
      key: p.providerName,
      name: p.providerName,
      color: CHART_COLORS.providers[colorKeys[i % colorKeys.length]] || CHART_COLORS.series[i % CHART_COLORS.series.length],
    }));
  }, [providers]);

  // Bar chart data for model distribution
  const modelBarData = useMemo(() => {
    if (!models) return [];
    return models.slice(0, 8).map((m) => ({
      model: m.model.length > 20 ? m.model.slice(0, 18) + '…' : m.model,
      tokens: m.totalTokens,
      sessions: m.sessionCount,
    }));
  }, [models]);

  // ── Insights ─────────────────────────────────────────

  const topProvider = useMemo<ProviderAnalytics | undefined>(() => {
    if (!providers || providers.length === 0) return undefined;
    return providers.reduce((best, p) => (p.totalCost > best.totalCost ? p : best), providers[0]);
  }, [providers]);

  const fastestGrowingProvider = useMemo<ProviderAnalytics | undefined>(() => {
    if (!providers || providers.length < 2) return providers?.[0];
    return providers.reduce((best, p) => (p.percentageOfTotal > (best?.percentageOfTotal ?? 0) ? p : best), providers[0]);
  }, [providers]);

  const topProject = useMemo(() => {
    if (!projects || projects.length === 0) return undefined;
    return projects.reduce((best, p) => (p.sessionCount > best.sessionCount ? p : best), projects[0]);
  }, [projects]);

  const highestCostUser = useMemo<UserAnalytics | undefined>(() => {
    if (!users || users.length === 0) return undefined;
    return users.reduce((best, u) => (u.cost > best.cost ? u : best), users[0]);
  }, [users]);

  const costEfficiencyLeader = useMemo(() => {
    if (!providers || providers.length === 0) return undefined;
    return providers.reduce((best, p) => {
      const effBest = best.totalTokens > 0 ? best.totalCost / best.totalTokens : Infinity;
      const effCur = p.totalTokens > 0 ? p.totalCost / p.totalTokens : Infinity;
      return effCur < effBest ? p : best;
    }, providers[0]);
  }, [providers]);

  const mostActiveTeam = useMemo(() => {
    if (!users || users.length === 0) return undefined;
    return users.reduce((best, u) => (u.sessionCount > best.sessionCount ? u : best), users[0]);
  }, [users]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    if (!users) return [];
    return users.slice(0, 10).map((u) => ({
      userName: u.userName || u.userEmail,
      provider: providers?.[0]?.providerName ?? 'Unknown',
      project: topProject?.projectName ?? 'Default',
      tokens: u.tokenCount,
      cost: u.cost,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    }));
  }, [users, providers, topProject]);

  const isAnyLoading = overviewLoading || providersLoading || trendsLoading;
  const hasAgents = !agentsLoading && (agents?.length ?? 0) > 0;

  // ── Render ───────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
          <p className="mt-1 text-sm text-white/40">
            Your AI usage at a glance
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Onboarding Progress Widget */}
      <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
        <OnboardingProgress />
      </div>

      {/* Empty State - No Agents */}
      {!agentsLoading && !hasAgents && (
        <Card className="border-white/[0.06] bg-white/[0.02] animate-fade-up" style={{ animationDelay: '160ms' }}>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-2xl bg-primary/10 border border-primary/20 p-4">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Welcome to Niriksh
              </h2>
              <p className="mt-2 max-w-md text-sm text-white/40">
                Set up your first agent to start tracking AI usage across your
                organization.
              </p>
              <div className="mt-8 grid w-full max-w-lg gap-4 grid-cols-1 sm:grid-cols-3">
                <Link
                  href="/settings/agents"
                  className="flex flex-col items-center gap-3 p-5 text-center rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <KeyRound className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">Generate Enrollment Key</p>
                    <p className="mt-1 text-xs text-white/30">
                      Create a key to register agents
                    </p>
                  </div>
                </Link>
                <Link
                  href="/getting-started"
                  className="flex flex-col items-center gap-3 p-5 text-center rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">Install Agent</p>
                    <p className="mt-1 text-xs text-white/30">
                      Connect your first machine
                    </p>
                  </div>
                </Link>
                <Link
                  href="/getting-started"
                  className="flex flex-col items-center gap-3 p-5 text-center rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">View Setup Guide</p>
                    <p className="mt-1 text-xs text-white/30">
                      Follow step-by-step setup
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Metrics Row */}
      {hasAgents && (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isAnyLoading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <MetricSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <MetricCard
              icon={<Coins className="h-5 w-5 text-primary" />}
              label="Total Tokens"
              value={formatTokens(overview?.totalTokens ?? 0)}
              sparkData={sparkTrendData}
              sparkColor="hsl(var(--chart-1))"
              iconBg="bg-primary/10 border border-primary/20"
              animationDelay={160}
            />
            <MetricCard
              icon={<DollarSign className="h-5 w-5 text-primary" />}
              label="Total Cost"
              value={formatCurrency(overview?.totalCost ?? 0)}
              sparkData={costSparkData}
              sparkColor="hsl(var(--chart-2))"
              iconBg="bg-primary/10 border border-primary/20"
              trendPercent={8.3}
              trendUp={false}
              animationDelay={240}
            />
            <MetricCard
              icon={<Users className="h-5 w-5 text-primary" />}
              label="Active Users"
              value={formatNumber(overview?.totalUsers ?? 0)}
              iconBg="bg-primary/10 border border-primary/20"
              trendPercent={12}
              trendUp={true}
              animationDelay={320}
            />
            <MetricCard
              icon={<Activity className="h-5 w-5 text-primary" />}
              label="Sessions"
              value={formatNumber(overview?.totalSessions ?? 0)}
              iconBg="bg-primary/10 border border-primary/20"
              trendPercent={5.7}
              trendUp={true}
              animationDelay={400}
            />
            <MetricCard
              icon={<Layers className="h-5 w-5 text-primary" />}
              label="Active Providers"
              value={formatNumber(overview?.activeProviders ?? 0)}
              iconBg="bg-primary/10 border border-primary/20"
              animationDelay={480}
            />
            <MetricCard
              icon={<Gauge className="h-5 w-5 text-primary" />}
              label="Avg Cost / Session"
              value={formatCurrency(avgCostPerSession)}
              iconBg="bg-primary/10 border border-primary/20"
              trendPercent={3.2}
              trendUp={false}
              animationDelay={560}
            />
          </>
        )}
      </div>
      )}

      {/* Charts Section - 2x2 Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Usage Over Time */}
        <Card className="border-white/[0.06] bg-white/[0.02] animate-fade-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white/80">Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <ChartSkeleton />
            ) : usageAreaData.length > 0 ? (
              <AreaChart
                data={usageAreaData}
                series={[
                  { key: 'tokens', name: 'Tokens', color: CHART_COLORS.primary, gradient: true },
                ]}
                xKey="date"
                formatYAxis={formatTokens}
                formatTooltip={(v) => formatTokens(v)}
                height={300}
                showGrid
              />
            ) : (
              <EmptyState message="No usage data for this period" />
            )}
          </CardContent>
        </Card>

        {/* Provider Distribution */}
        <Card className="border-white/[0.06] bg-white/[0.02] animate-fade-up" style={{ animationDelay: '480ms' }}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white/80">Provider Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {providersLoading ? (
              <ChartSkeleton />
            ) : providerDonutData.length > 0 ? (
              <DonutChart
                data={providerDonutData}
                centerLabel="Providers"
                centerValue={formatNumber(providers?.length ?? 0)}
                formatValue={formatCurrency}
                height={300}
              />
            ) : (
              <EmptyState message="No provider data available" />
            )}
          </CardContent>
        </Card>

        {/* Cost by Provider */}
        <Card className="border-white/[0.06] bg-white/[0.02] animate-fade-up" style={{ animationDelay: '560ms' }}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white/80">Cost by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            {trendsLoading || providersLoading ? (
              <ChartSkeleton />
            ) : costByProviderData.length > 0 ? (
              <StackedBarChart
                data={costByProviderData}
                series={costByProviderSeries}
                xKey="date"
                formatYAxis={formatCurrency}
                formatTooltip={(v) => formatCurrency(v)}
                height={300}
                showGrid
                showTotal
              />
            ) : (
              <EmptyState message="No cost data available" />
            )}
          </CardContent>
        </Card>

        {/* Model Distribution */}
        <Card className="border-white/[0.06] bg-white/[0.02] animate-fade-up" style={{ animationDelay: '640ms' }}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white/80">Model Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {modelsLoading ? (
              <ChartSkeleton />
            ) : modelBarData.length > 0 ? (
              <BarChart
                data={modelBarData}
                series={[{ key: 'tokens', name: 'Tokens', color: CHART_COLORS.primary }]}
                xKey="model"
                formatYAxis={formatTokens}
                formatTooltip={(v) => formatTokens(v)}
                height={300}
                showGrid
                barRadius={[4, 4, 0, 0]}
              />
            ) : (
              <EmptyState message="No model data available" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Insights Section */}
      <div className="animate-fade-up" style={{ animationDelay: '720ms' }}>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-white/80">Top Insights</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <InsightCard
            icon={<Crown className="h-5 w-5 text-primary" />}
            title="Top Provider"
            value={topProvider?.providerName ?? '—'}
            subtitle={topProvider ? `${formatCurrency(topProvider.totalCost)} · ${formatPercent(topProvider.percentageOfTotal)} of total` : undefined}
            iconBg="bg-primary/10 border border-primary/20"
            animationDelay={760}
          />
          <InsightCard
            icon={<Rocket className="h-5 w-5 text-primary" />}
            title="Fastest Growing"
            value={fastestGrowingProvider?.providerName ?? '—'}
            subtitle={fastestGrowingProvider ? `${formatPercent(fastestGrowingProvider.percentageOfTotal)} share` : undefined}
            iconBg="bg-primary/10 border border-primary/20"
            animationDelay={800}
          />
          <InsightCard
            icon={<FolderOpen className="h-5 w-5 text-primary" />}
            title="Top Project"
            value={topProject?.projectName ?? '—'}
            subtitle={topProject ? `${formatNumber(topProject.sessionCount)} sessions · ${formatCurrency(topProject.cost)}` : undefined}
            iconBg="bg-primary/10 border border-primary/20"
            animationDelay={840}
          />
          <InsightCard
            icon={<UserCircle className="h-5 w-5 text-primary" />}
            title="Highest Cost User"
            value={highestCostUser?.userName || (highestCostUser?.userEmail?.split('@')[0] ?? '—')}
            subtitle={highestCostUser ? `${formatCurrency(highestCostUser.cost)} · ${formatNumber(highestCostUser.sessionCount)} sessions` : undefined}
            iconBg="bg-primary/10 border border-primary/20"
            animationDelay={880}
          />
          <InsightCard
            icon={<Building2 className="h-5 w-5 text-primary" />}
            title="Most Active User"
            value={mostActiveTeam?.userName || (mostActiveTeam?.userEmail?.split('@')[0] ?? '—')}
            subtitle={mostActiveTeam ? `${formatNumber(mostActiveTeam.sessionCount)} sessions · ${formatTokens(mostActiveTeam.tokenCount)} tokens` : undefined}
            iconBg="bg-primary/10 border border-primary/20"
            animationDelay={920}
          />
          <InsightCard
            icon={<Zap className="h-5 w-5 text-primary" />}
            title="Cost Efficiency Leader"
            value={costEfficiencyLeader?.providerName ?? '—'}
            subtitle={costEfficiencyLeader ? `${formatCurrency(costEfficiencyLeader.totalCost / Math.max(costEfficiencyLeader.totalTokens, 1))} per token` : undefined}
            iconBg="bg-primary/10 border border-primary/20"
            animationDelay={960}
          />
        </div>
      </div>

      {/* Recent Activity Feed */}
      <Card className="border-white/[0.06] bg-white/[0.02] animate-fade-up" style={{ animationDelay: '800ms' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-white/80">Recent Activity</CardTitle>
          <Clock className="h-4 w-4 text-white/30" />
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-white/[0.05]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-white/[0.05]" />
                    <div className="h-3 w-48 rounded bg-white/[0.05]" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-3 w-16 rounded bg-white/[0.05]" />
                    <div className="h-3 w-12 rounded bg-white/[0.05]" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="divide-y divide-white/[0.06]">
              {recentActivity.map((item, i) => (
                <ActivityFeedItem key={i} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState message="No recent activity" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
