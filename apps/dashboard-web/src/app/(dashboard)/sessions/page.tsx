'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listSessions } from '@/lib/api';
import type { SessionListFilters } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatTokens, formatRelativeTime } from '@/lib/utils';
import {
  Search,
  Activity,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function SessionsPage() {
  const [filters, setFilters] = useState<SessionListFilters>({
    page: 1,
    limit: 20,
    search: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', filters],
    queryFn: () => listSessions(filters),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and analyze AI usage sessions
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            className="pl-10"
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
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
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Provider</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">User</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Machine</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tokens</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cost</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Duration</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Time</th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.sessions.map((session) => (
                    <tr
                      key={session.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
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
