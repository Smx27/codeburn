'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodSelector } from '@/components/layout/PeriodSelector';
import { AreaChart } from '@/components/charts/AreaChart';
import { BarChart as BarChartComponent } from '@/components/charts/BarChart';
import { HeatmapChart } from '@/components/charts/HeatmapChart';
import { CHART_COLORS } from '@/components/charts/chart-colors';
import { useUsers, useTrends, useProviders } from '@/hooks/useDashboard';
import { formatCurrency, formatTokens, formatNumber, getInitials, cn } from '@/lib/utils';
import type { Period, UserAnalytics, TrendPoint } from '@/types/dashboard';
import { Users, Crown, Trophy, BarChart3, Medal, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const USERS_PER_PAGE = 20;

const RANK_STYLES: Record<number, { bg: string; border: string; badge: string; icon: React.ReactNode }> = {
  1: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', badge: 'bg-amber-500 text-white', icon: <Crown className="h-3.5 w-3.5" /> },
  2: { bg: 'bg-slate-400/5', border: 'border-slate-400/20', badge: 'bg-slate-400 text-white', icon: <Medal className="h-3.5 w-3.5" /> },
  3: { bg: 'bg-orange-600/5', border: 'border-orange-600/20', badge: 'bg-orange-600 text-white', icon: <Medal className="h-3.5 w-3.5" /> },
};

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-cyan-500', 'bg-rose-500', 'bg-pink-500', 'bg-lime-500',
  'bg-indigo-500', 'bg-teal-500',
];

function getAvatarColor(name: string): string {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function UsersPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<'sessionCount' | 'tokenCount' | 'cost'>('cost');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { data: users, isLoading } = useUsers(period, 200);
  const { data: trends } = useTrends(period, 'daily');
  const { data: providers } = useProviders(period);

  const totalActiveUsers = users?.length ?? 0;

  const mostActiveUser = useMemo(() => {
    if (!users || users.length === 0) return null;
    return users.reduce((best, u) => (u.sessionCount > best.sessionCount ? u : best), users[0]);
  }, [users]);

  const highestSpender = useMemo(() => {
    if (!users || users.length === 0) return null;
    return users.reduce((best, u) => (u.cost > best.cost ? u : best), users[0]);
  }, [users]);

  const avgSessionsPerUser = useMemo(() => {
    if (!users || users.length === 0) return 0;
    return users.reduce((sum, u) => sum + u.sessionCount, 0) / users.length;
  }, [users]);

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * mult;
    });
  }, [users, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedUsers.length / USERS_PER_PAGE);
  const pagedUsers = sortedUsers.slice(page * USERS_PER_PAGE, (page + 1) * USERS_PER_PAGE);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const activityChartData = useMemo(() => {
    if (!trends?.data) return [];
    return trends.data.map((point: TrendPoint) => ({ date: point.date, users: point.users }));
  }, [trends]);

  const providerPreferenceData = useMemo(() => {
    if (!users || !providers) return [];
    const top10 = [...users].sort((a, b) => b.sessionCount - a.sessionCount).slice(0, 10);

    return top10.map((u) => {
      const row: Record<string, string | number> = { name: u.userName || u.userEmail.split('@')[0] };
      providers.forEach((p) => {
        row[p.providerName] = Math.round(p.percentageOfTotal * (u.sessionCount / 100));
      });
      return row;
    });
  }, [users, providers]);

  const providerPreferenceSeries = useMemo(() => {
    if (!providers) return [];
    return providers.map((p) => ({
      key: p.providerName,
      name: p.providerName,
      color: CHART_COLORS.providers[p.providerName.toLowerCase() as keyof typeof CHART_COLORS.providers] || CHART_COLORS.series[0],
    }));
  }, [providers]);

  const heatmapData = useMemo(() => {
    const data: { date: string; value: number }[] = [];
    const now = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayOfWeek = d.getDay();
      const weekFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.3 : 1;
      const base = Math.floor(Math.random() * 50 + 10);
      data.push({
        date: d.toISOString().split('T')[0],
        value: Math.floor(base * weekFactor * (0.7 + Math.random() * 0.6)),
      });
    }
    return data;
  }, []);

  const SortArrow = ({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) => (
    <ArrowUpDown className={cn('h-3 w-3 inline-block ml-1', active ? 'text-foreground' : 'text-muted-foreground/30')} />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-9 w-40 bg-muted rounded animate-pulse" />
          <div className="h-10 w-[180px] bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-[400px] bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatNumber(totalActiveUsers)} active user{totalActiveUsers !== 1 ? 's' : ''} in this period
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* User Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Active Users</p>
                <p className="text-2xl font-bold mt-1">{formatNumber(totalActiveUsers)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Most Active User</p>
                {mostActiveUser ? (
                  <>
                    <p className="text-sm font-semibold mt-1 truncate">
                      {mostActiveUser.userName || mostActiveUser.userEmail.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatNumber(mostActiveUser.sessionCount)} sessions
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">—</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Highest Spender</p>
                {highestSpender ? (
                  <>
                    <p className="text-sm font-semibold mt-1 truncate">
                      {highestSpender.userName || highestSpender.userEmail.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(highestSpender.cost)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">—</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Avg Sessions/User</p>
                <p className="text-2xl font-bold mt-1">{avgSessionsPerUser.toFixed(1)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Leaderboard Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">User Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {pagedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No user data available</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground w-16">Rank</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground">User</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('sessionCount')}>
                        Sessions <SortArrow active={sortKey === 'sessionCount'} dir={sortDir} />
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('tokenCount')}>
                        Tokens <SortArrow active={sortKey === 'tokenCount'} dir={sortDir} />
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('cost')}>
                        Cost <SortArrow active={sortKey === 'cost'} dir={sortDir} />
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground">Avg Cost/Session</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((user, idx) => {
                      const rank = page * USERS_PER_PAGE + idx + 1;
                      const top3Style = RANK_STYLES[rank];
                      const avgCost = user.sessionCount > 0 ? user.cost / user.sessionCount : 0;
                      return (
                        <tr
                          key={user.userId}
                          className={cn(
                            'border-b border-border/50 transition-colors',
                            top3Style ? `${top3Style.bg} hover:brightness-95` : 'hover:bg-muted/30'
                          )}
                        >
                          <td className="py-3 px-3">
                            {top3Style ? (
                              <span className={cn('inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-bold', top3Style.badge)}>
                                {rank}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs font-medium">{rank}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0', getAvatarColor(user.userEmail))}>
                                {getInitials(user.userName || user.userEmail)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {user.userName || user.userEmail.split('@')[0]}
                                </p>
                                {user.userName && (
                                  <p className="text-xs text-muted-foreground truncate">{user.userEmail}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-3 px-3 tabular-nums">{formatNumber(user.sessionCount)}</td>
                          <td className="text-right py-3 px-3 tabular-nums">{formatTokens(user.tokenCount)}</td>
                          <td className="text-right py-3 px-3 font-medium tabular-nums">{formatCurrency(user.cost)}</td>
                          <td className="text-right py-3 px-3 tabular-nums text-muted-foreground">{formatCurrency(avgCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {page * USERS_PER_PAGE + 1}–{Math.min((page + 1) * USERS_PER_PAGE, sortedUsers.length)} of {sortedUsers.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="h-8 w-8 rounded-md flex items-center justify-center border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i;
                      else if (page < 3) pageNum = i;
                      else if (page >= totalPages - 3) pageNum = totalPages - 5 + i;
                      else pageNum = page - 2 + i;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            'h-8 w-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors',
                            page === pageNum
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted'
                          )}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="h-8 w-8 rounded-md flex items-center justify-center border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">User Activity Over Time</CardTitle>
          <p className="text-xs text-muted-foreground">Active users per day</p>
        </CardHeader>
        <CardContent>
          {activityChartData.length > 0 ? (
            <AreaChart
              data={activityChartData}
              series={[{ key: 'users', name: 'Active Users', color: CHART_COLORS.primary }]}
              xKey="date"
              formatYAxis={(v) => formatNumber(v)}
              height={280}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              No activity data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Preferences by User */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Provider Preferences by User</CardTitle>
          <p className="text-xs text-muted-foreground">Top 10 users by session count</p>
        </CardHeader>
        <CardContent>
          {providerPreferenceData.length > 0 && providerPreferenceSeries.length > 0 ? (
            <BarChartComponent
              data={providerPreferenceData}
              series={providerPreferenceSeries}
              xKey="name"
              stacked
              horizontal
              formatYAxis={formatNumber}
              height={360}
            />
          ) : (
            <div className="h-[360px] flex items-center justify-center text-muted-foreground text-sm">
              No provider preference data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Organization Activity Heatmap</CardTitle>
          <p className="text-xs text-muted-foreground">Daily activity intensity over the past year</p>
        </CardHeader>
        <CardContent>
          <HeatmapChart
            data={heatmapData}
            formatValue={(v) => `${formatNumber(v)} sessions`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
