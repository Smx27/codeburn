'use client';

import { useQuery } from '@tanstack/react-query';
import { getMachine } from '@/lib/api';
import { use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatTokens, formatRelativeTime } from '@/lib/utils';
import { ArrowLeft, Cpu, Monitor, Clock } from 'lucide-react';

export default function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ['machine', id],
    queryFn: () => getMachine(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {data.machine.hostname}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Badge variant={data.machine.status === 'ONLINE' ? 'success' : 'secondary'}>
              {data.machine.status}
            </Badge>
            {data.machine.os} &middot; {data.machine.architecture}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Sessions</div>
            <div className="text-2xl font-bold text-foreground">{data.stats.totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Tokens</div>
            <div className="text-2xl font-bold text-foreground">{formatTokens(data.stats.totalTokens)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(data.stats.totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Last Seen</div>
            <div className="text-sm font-medium text-foreground mt-1">{formatRelativeTime(data.machine.lastSeen)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Provider breakdown */}
      {data.providerBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Provider Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.providerBreakdown.map((p) => (
                <div key={p.provider} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{p.provider}</Badge>
                    <span className="text-sm text-muted-foreground">{p.sessions} sessions</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono text-foreground">{formatTokens(p.tokens)}</span>
                    <span className="font-mono text-foreground">{formatCurrency(p.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent sessions */}
      {data.recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{session.provider}</Badge>
                    <span className="text-sm text-foreground">{session.userEmail}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono">{formatTokens(session.totalTokens)}</span>
                    <span className="font-mono">{formatCurrency(session.estimatedCost)}</span>
                    <span>{formatRelativeTime(session.startedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
