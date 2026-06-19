'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';
import { listSessions } from '@/lib/api';
import type { SessionListItem, SessionListFilters } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Activity,
} from 'lucide-react';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.01) return '<$0.01';
  return `$${cost.toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return String(tokens);
}

export default function SessionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SessionListFilters>({
    page: 1,
    limit: 20,
    sortBy: 'started_at',
    sortDir: 'desc',
  });
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('started_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    loadSessions();
  }, [filters]);

  async function loadSessions() {
    try {
      setLoading(true);
      const result = await listSessions({
        ...filters,
        search: search || undefined,
        provider: providerFilter || undefined,
      });
      setSessions(result.sessions);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadSessions();
  }

  function handleSort(column: string) {
    const newDir = sortColumn === column && sortDir === 'desc' ? 'asc' : 'desc';
    setSortColumn(column);
    setSortDir(newDir);
    setFilters((prev) => ({ ...prev, sortBy: column, sortDir: newDir, page: 1 }));
  }

  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    );
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground">
            View and analyze all AI coding sessions
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">All Sessions</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-64"
                  />
                </div>
                <select
                  value={providerFilter}
                  onChange={(e) => {
                    setProviderFilter(e.target.value);
                    setFilters((prev) => ({ ...prev, provider: e.target.value || undefined, page: 1 }));
                  }}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Providers</option>
                  <option value="claude">Claude</option>
                  <option value="cursor">Cursor</option>
                  <option value="codex">Codex</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No sessions found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {search || providerFilter ? 'Try adjusting your filters' : 'Sessions will appear here once data is synced'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Provider</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Model</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">User</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Machine</th>
                        <th
                          className="text-left py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => handleSort('started_at')}
                        >
                          <div className="flex items-center gap-1">
                            Started At <SortIcon column="started_at" />
                          </div>
                        </th>
                        <th
                          className="text-left py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => handleSort('duration')}
                        >
                          <div className="flex items-center gap-1">
                            Duration <SortIcon column="duration" />
                          </div>
                        </th>
                        <th
                          className="text-right py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => handleSort('tokens')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Tokens <SortIcon column="tokens" />
                          </div>
                        </th>
                        <th
                          className="text-right py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => handleSort('cost')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Cost <SortIcon column="cost" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr
                          key={session.id}
                          className="border-b border-border/30 hover:bg-muted/30 cursor-pointer"
                          onClick={() => router.push(`/sessions/${session.id}`)}
                        >
                          <td className="py-3 px-2">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              {session.provider}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground max-w-[150px] truncate">
                            {session.projectName || '-'}
                          </td>
                          <td className="py-3 px-2">{session.userName}</td>
                          <td className="py-3 px-2 text-muted-foreground">{session.machineName}</td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {new Date(session.startedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {formatDuration(session.durationSeconds)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono">
                            {formatTokens(session.totalTokens)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono">
                            {formatCost(session.estimatedCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Showing {(filters.page! - 1) * filters.limit! + 1}–{Math.min(filters.page! * filters.limit!, total)} of {total} sessions
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 1}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            filters.page === page
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page === totalPages}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
