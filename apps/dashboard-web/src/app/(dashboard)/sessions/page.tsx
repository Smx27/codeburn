'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listSessions } from '@/lib/api';
import type { SessionListFilters } from '@/types/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatTokens, formatRelativeTime } from '@/lib/utils';
import {
  Search,
  Activity,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react';

const PROVIDER_OPTIONS = [
  { value: 'all', label: 'All Providers' },
  { value: 'claude', label: 'Claude' },
  { value: 'codex', label: 'Codex' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'opencode', label: 'OpenCode' },
  { value: 'warp', label: 'Warp' },
];

const SORT_OPTIONS = [
  { value: 'startedAt:desc', label: 'Newest First' },
  { value: 'startedAt:asc', label: 'Oldest First' },
  { value: 'totalTokens:desc', label: 'Most Tokens' },
  { value: 'estimatedCost:desc', label: 'Highest Cost' },
  { value: 'durationSeconds:desc', label: 'Longest Duration' },
];

export default function SessionsPage() {
  const [filters, setFilters] = useState<SessionListFilters>({
    page: 1,
    limit: 20,
    search: '',
  });
  const [provider, setProvider] = useState('all');
  const [sort, setSort] = useState('startedAt:desc');

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', filters, provider, sort],
    queryFn: () => {
      const [sortBy, sortDir] = sort.split(':');
      return listSessions({
        ...filters,
        provider: provider === 'all' ? undefined : provider,
        sortBy,
        sortDir: sortDir as 'asc' | 'desc',
      });
    },
  });

  const activeFilterCount = [provider !== 'all'].filter(Boolean).length;

  const clearFilters = () => {
    setProvider('all');
    setSort('startedAt:desc');
    setFilters({ page: 1, limit: 20, search: '' });
  };

  return (
    <div className="space-y-6">
      <div
        className="flex items-center justify-between animate-fade-up"
        style={{ animationDelay: '0ms' }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and analyze AI usage sessions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap items-center gap-3 animate-fade-up"
        style={{ animationDelay: '80ms' }}
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            className="pl-10"
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>

        <Select value={provider} onValueChange={(v) => { setProvider(v); setFilters({ ...filters, page: 1 }); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {provider !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filters:</span>
          <Badge variant="default" className="gap-1">
            Provider: {provider}
            <button onClick={() => setProvider('all')} className="ml-1 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Table */}
      <div
        className="animate-fade-up"
        style={{ animationDelay: '160ms' }}
      >
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </div>
                ))}
              </div>
            ) : !data?.sessions.length ? (
              <EmptyState
                icon={Activity}
                title="No sessions yet"
                description="Start syncing your AI usage data to see sessions here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th scope="col" className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Provider</th>
                      <th scope="col" className="text-left text-xs font-medium text-muted-foreground px-4 py-3">User</th>
                      <th scope="col" className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Machine</th>
                      <th scope="col" className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tokens</th>
                      <th scope="col" className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cost</th>
                      <th scope="col" className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Duration</th>
                      <th scope="col" className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Time</th>
                      <th scope="col" className="w-10 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sessions.map((session) => (
                      <tr
                        key={session.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {session.provider}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {session.userEmail}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {session.machineName}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground font-mono">
                          {formatTokens(session.totalTokens)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground font-mono">
                          {formatCurrency(session.estimatedCost)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {Math.round(session.durationSeconds / 60)}m
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatRelativeTime(session.startedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/sessions/${session.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((data.page - 1) * data.limit) + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total} sessions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setFilters({ ...filters, page: data.page - 1 })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {data.page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => setFilters({ ...filters, page: data.page + 1 })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
