'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';
import { getMachine } from '@/lib/api';
import type { MachineDetailResponse } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  ArrowLeft,
  Monitor,
  Cpu,
  Activity,
  Coins,
  Calendar,
  Clock,
} from 'lucide-react';

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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

export default function MachineDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const machineId = params.id as string;
  const [machine, setMachine] = useState<MachineDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (machineId) {
      loadMachine();
    }
  }, [machineId]);

  async function loadMachine() {
    try {
      setLoading(true);
      setError(null);
      const data = await getMachine(machineId);
      setMachine(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load machine');
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
            onClick={() => router.push('/settings/agents')}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Machine Detail</h1>
            <p className="text-sm text-muted-foreground">
              View machine info, metrics, and recent sessions
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
                onClick={loadMachine}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </CardContent>
          </Card>
        ) : !machine ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Machine not found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Machine Info</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Hostname</p>
                      <p className="text-sm font-medium">{machine.machine.hostname}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          machine.machine.status === 'ONLINE'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {machine.machine.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">OS</p>
                      <p className="text-sm font-medium">{machine.machine.os || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Architecture</p>
                      <p className="text-sm font-medium">{machine.machine.architecture || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Agent Version</p>
                      <p className="text-sm font-medium">{machine.machine.agentVersion || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">User</p>
                      <p className="text-sm font-medium">{machine.machine.user.name || machine.machine.user.email}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        First Seen
                      </div>
                      <p className="text-sm font-medium">
                        {new Date(machine.machine.firstSeen).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Last Seen
                      </div>
                      <p className="text-sm font-medium">
                        {new Date(machine.machine.lastSeen).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Metrics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Total Sessions</p>
                      <p className="text-2xl font-bold">{machine.stats.totalSessions}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Total Tokens</p>
                      <p className="text-2xl font-bold text-primary">{formatTokens(machine.stats.totalTokens)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                      <p className="text-2xl font-bold text-primary">{formatCost(machine.stats.totalCost)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Provider Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {machine.providerBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                  ) : (
                    <div className="space-y-3">
                      {machine.providerBreakdown.map((p) => (
                        <div key={p.provider} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{p.provider}</span>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{p.sessions} sessions</span>
                            <span>{formatTokens(p.tokens)} tokens</span>
                            <span className="font-mono">{formatCost(p.cost)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Model Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {machine.modelBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                  ) : (
                    <div className="space-y-3">
                      {machine.modelBreakdown.map((m) => (
                        <div key={m.model} className="flex items-center justify-between">
                          <span className="text-sm font-medium max-w-[200px] truncate">{m.model}</span>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{m.sessions} sessions</span>
                            <span>{formatTokens(m.tokens)} tokens</span>
                            <span className="font-mono">{formatCost(m.cost)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Daily Activity (30 days)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {machine.dailyActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity data</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Sessions</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Tokens</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {machine.dailyActivity.map((day) => (
                          <tr key={day.date} className="border-b border-border/30">
                            <td className="py-3 px-2">{day.date}</td>
                            <td className="py-3 px-2 text-right">{day.sessions}</td>
                            <td className="py-3 px-2 text-right font-mono">{formatTokens(day.tokens)}</td>
                            <td className="py-3 px-2 text-right font-mono">{formatCost(day.cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {machine.recentSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No sessions</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Provider</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Started</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Duration</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Tokens</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {machine.recentSessions.map((session) => (
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
                            <td className="py-3 px-2 text-right font-mono">{formatTokens(session.totalTokens)}</td>
                            <td className="py-3 px-2 text-right font-mono">{formatCost(session.estimatedCost)}</td>
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
