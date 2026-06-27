'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSession } from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatTokens, formatDate, formatRelativeTime } from '@/lib/utils';
import { ArrowLeft, Clock, Cpu, User, Hash } from 'lucide-react';

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-4 animate-fade-up"
        style={{ animationDelay: '0ms' }}
      >
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sessions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Session Details
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {session.provider} session from {formatRelativeTime(session.startedAt)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up"
        style={{ animationDelay: '80ms' }}
      >
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Tokens</div>
            <div className="text-2xl font-bold text-foreground">{formatTokens(session.totalTokens)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Estimated Cost</div>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(session.estimatedCost)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Duration</div>
            <div className="text-2xl font-bold text-foreground">{Math.round(session.durationSeconds / 60)}m</div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Events</div>
            <div className="text-2xl font-bold text-foreground">{session.eventCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up"
        style={{ animationDelay: '160ms' }}
      >
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-sm">Session Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono text-foreground">{session.id}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Provider:</span>
              <Badge variant="default">{session.provider}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">User:</span>
              <span className="text-foreground">{session.user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Started:</span>
              <span className="text-foreground">{formatDate(session.startedAt, 'long')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-sm">Token Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Input Tokens</span>
              <span className="font-mono text-foreground">{formatTokens(session.totalInputTokens)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Output Tokens</span>
              <span className="font-mono text-foreground">{formatTokens(session.totalOutputTokens)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Tokens</span>
              <span className="font-mono text-foreground font-medium">{formatTokens(session.totalTokens)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events */}
      {session.events.length > 0 && (
        <Card
          className="bg-white/[0.02] border-white/[0.06] animate-fade-up"
          style={{ animationDelay: '240ms' }}
        >
          <CardHeader>
            <CardTitle className="text-sm">Events ({session.events.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {session.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="text-xs">{event.eventType}</Badge>
                    <span className="text-sm text-foreground font-mono">{event.model}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono">{formatTokens(event.inputTokens + event.outputTokens)} tokens</span>
                    <span className="font-mono">{formatCurrency(event.estimatedCost)}</span>
                    <span>{formatRelativeTime(event.eventTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
