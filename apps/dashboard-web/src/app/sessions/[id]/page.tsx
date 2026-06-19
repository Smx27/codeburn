'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';
import { getSession } from '@/lib/api';
import type { SessionDetail } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  ArrowLeft,
  Clock,
  Coins,
  Activity,
  Cpu,
  User,
  Monitor,
  Calendar,
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
  return `$${cost.toFixed(4)}`;
}

function formatTokens(tokens: number): string {
  return tokens.toLocaleString();
}

export default function SessionDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  async function loadSession() {
    try {
      setLoading(true);
      setError(null);
      const data = await getSession(sessionId);
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/sessions')}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Session Detail</h1>
            <p className="text-sm text-muted-foreground">
              View session metadata and event timeline
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={loadSession}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </CardContent>
          </Card>
        ) : !session ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Session not found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Overview</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Provider</p>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {session.provider}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Project</p>
                      <p className="text-sm font-medium">{session.projectName || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        User
                      </div>
                      <p className="text-sm font-medium">{session.user.name || session.user.email}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Monitor className="h-3 w-3" />
                        Machine
                      </div>
                      <p className="text-sm font-medium">{session.machine.hostname}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Started At
                      </div>
                      <p className="text-sm font-medium">
                        {new Date(session.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Ended At
                      </div>
                      <p className="text-sm font-medium">
                        {session.endedAt ? new Date(session.endedAt).toLocaleString() : 'In progress'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Duration
                      </div>
                      <p className="text-sm font-medium">{formatDuration(session.durationSeconds)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Events</p>
                      <p className="text-sm font-medium">{session.eventCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Usage</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Input Tokens</p>
                      <p className="text-2xl font-bold">{formatTokens(session.totalInputTokens)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Output Tokens</p>
                      <p className="text-2xl font-bold">{formatTokens(session.totalOutputTokens)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Total Tokens</p>
                      <p className="text-2xl font-bold text-primary">{formatTokens(session.totalTokens)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Estimated Cost</p>
                      <p className="text-2xl font-bold text-primary">{formatCost(session.estimatedCost)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Event Timeline</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {session.events.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No events recorded for this session
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Timestamp</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Event Type</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Model</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Input Tokens</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Output Tokens</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.events.map((event) => (
                          <tr key={event.id} className="border-b border-border/30">
                            <td className="py-3 px-2 text-muted-foreground">
                              {new Date(event.eventTime).toLocaleString()}
                            </td>
                            <td className="py-3 px-2">
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                {event.eventType}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground max-w-[200px] truncate">
                              {event.model}
                            </td>
                            <td className="py-3 px-2 text-right font-mono">{formatTokens(event.inputTokens)}</td>
                            <td className="py-3 px-2 text-right font-mono">{formatTokens(event.outputTokens)}</td>
                            <td className="py-3 px-2 text-right font-mono">{formatCost(event.estimatedCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
