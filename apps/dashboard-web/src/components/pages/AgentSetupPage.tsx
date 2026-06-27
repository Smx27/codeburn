'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  listEnrollmentKeys,
  generateEnrollmentKey,
  revokeEnrollmentKey,
  rotateEnrollmentKey,
  listAgents,
} from '@/lib/api';
import type { EnrollmentKey, Agent } from '@/types/dashboard';
import {
  Bot,
  Key,
  Plus,
  Copy,
  Trash2,
  Check,
  RefreshCw,
  Monitor,
  ExternalLink,
  Download,
  Clock,
} from 'lucide-react';

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

const INSTALL_COMMANDS: Record<string, { label: string; cmd: string }[]> = {
  Windows: [
    { label: 'Install', cmd: 'irm https://niriksh.titanbyte.in/install.ps1 | iex' },
    { label: 'Login', cmd: 'niriksh login' },
    { label: 'Start', cmd: 'niriksh sync' },
  ],
  macOS: [
    { label: 'Install', cmd: 'curl -fsSL https://niriksh.titanbyte.in/install.sh | bash' },
    { label: 'Login', cmd: 'niriksh login' },
    { label: 'Start', cmd: 'niriksh sync' },
  ],
  Linux: [
    { label: 'Install', cmd: 'curl -fsSL https://niriksh.titanbyte.in/install.sh | bash' },
    { label: 'Login', cmd: 'niriksh login' },
    { label: 'Start', cmd: 'niriksh sync' },
  ],
};

export function AgentSetupPage() {
  const [keys, setKeys] = useState<EnrollmentKey[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Key creation state
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [creating, setCreating] = useState(false);

  // Confirmation state
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [confirmRotate, setConfirmRotate] = useState<string | null>(null);

  // Install tabs
  const [installTab, setInstallTab] = useState('Linux');
  const [copiedCmdIdx, setCopiedCmdIdx] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoadingKeys(true);
      setLoadingAgents(true);
      setError(null);
      const [k, a] = await Promise.all([listEnrollmentKeys(), listAgents()]);
      setKeys(k);
      setAgents(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoadingKeys(false);
      setLoadingAgents(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const result = await generateEnrollmentKey({
        name: newKeyName.trim(),
        expiresAt: newKeyExpiry || undefined,
      });
      setCreatedKey(result.key);
      setNewKeyName('');
      setNewKeyExpiry('');
      setShowNewKeyForm(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await revokeEnrollmentKey(id);
      setConfirmRevoke(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    }
  };

  const handleRotateKey = async (id: string) => {
    try {
      const result = await rotateEnrollmentKey(id);
      setCreatedKey(result.key);
      setConfirmRotate(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate key');
    }
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Agent Setup</h1>
        <p className="text-sm text-muted-foreground">
          Manage enrollment keys, view registered machines, and get installation instructions
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive-subtle p-3 text-sm text-destructive">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* ── Enrollment Keys ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Enrollment Keys</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Keys used by agents to register with your organization
              </CardDescription>
            </div>
            <button
              onClick={() => setShowNewKeyForm(!showNewKeyForm)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Generate New Key
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {showNewKeyForm && (
            <div className="mb-4 rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Create new enrollment key</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Key name (e.g., Production Server)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="date"
                  placeholder="Expiry (optional)"
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleCreateKey}
                  disabled={!newKeyName.trim() || creating}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => { setShowNewKeyForm(false); setNewKeyName(''); setNewKeyExpiry(''); }}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {createdKey && (
            <div className="mb-4 rounded-lg border border-success/20 bg-success-subtle p-4 space-y-2">
              <p className="text-xs font-medium text-success">Key created — copy it now, it won&apos;t be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background/50 px-3 py-1.5 text-xs font-mono break-all">{createdKey}</code>
                <button
                  onClick={() => copyToClipboard(createdKey, setCopiedKey)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button onClick={() => setCreatedKey(null)} className="text-xs text-muted-foreground hover:text-foreground">dismiss</button>
            </div>
          )}

          {loadingKeys ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <EmptyState
              icon={Key}
              title="No enrollment keys"
              description="Create a key to let agents register with your organization."
              action={{ label: 'Generate Key', onClick: () => setShowNewKeyForm(true) }}
            />
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${k.active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{k.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <code className="font-mono">{k.keyPrefix}••••••••</code>
                        <span>&middot;</span>
                        <span>Created {new Date(k.createdAt).toLocaleDateString()}</span>
                        <span>&middot;</span>
                        <span>Last used {relativeTime(k.lastUsedAt)}</span>
                        {k.expiresAt && (
                          <>
                            <span>&middot;</span>
                            <span>Expires {new Date(k.expiresAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={k.active ? 'success' : 'default'}>
                      {k.active ? 'Active' : 'Expired'}
                    </Badge>
                    {confirmRotate === k.id ? (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleRotateKey(k.id)}
                          className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmRotate(null)}
                          className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : confirmRevoke === k.id ? (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="rounded-md bg-destructive px-2 py-1 text-[11px] font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
                        >
                          Revoke
                        </button>
                        <button
                          onClick={() => setConfirmRevoke(null)}
                          className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => setConfirmRotate(k.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Rotate key"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmRevoke(k.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Revoke key"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Registered Machines ────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Registered Machines</CardTitle>
          </div>
          <CardDescription>Agents that have registered with your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAgents ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <EmptyState
              icon={Monitor}
              title="No agents registered"
              description="Install the agent on your machines to start monitoring."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground">
                    <th className="pb-2 pr-4">Hostname</th>
                    <th className="pb-2 pr-4">OS</th>
                    <th className="pb-2 pr-4">Arch</th>
                    <th className="pb-2 pr-4">Version</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 pr-4 font-medium">{agent.hostname}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{agent.os}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{agent.architecture}</td>
                      <td className="py-3 pr-4">
                        <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded">{agent.agentVersion}</code>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${agent.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          <span className={agent.status === 'ONLINE' ? 'text-emerald-500' : 'text-muted-foreground'}>
                            {agent.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {relativeTime(agent.lastSeenAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Installation Commands ──────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Installation Commands</CardTitle>
          </div>
          <CardDescription>Install the Niriksh agent on your machines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex rounded-lg border border-border bg-muted/50 p-0.5 mb-4 w-fit">
            {Object.keys(INSTALL_COMMANDS).map((platform) => (
              <button
                key={platform}
                onClick={() => setInstallTab(platform)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  installTab === platform
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {INSTALL_COMMANDS[installTab].map((step, idx) => (
              <div key={idx}>
                <p className="text-xs font-medium text-muted-foreground mb-1">{step.label}</p>
                <div className="flex items-center gap-2">
                  <pre className="flex-1 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs font-mono overflow-x-auto">
                    <code>{step.cmd}</code>
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(step.cmd);
                      setCopiedCmdIdx(idx);
                      setTimeout(() => setCopiedCmdIdx(null), 2000);
                    }}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Copy command"
                  >
                    {copiedCmdIdx === idx ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Download Links ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Download Links</CardTitle>
          </div>
          <CardDescription>Direct download links for the CLI agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { platform: 'Windows', arch: 'x86_64', url: 'https://github.com/Smx27/codeburn/releases/latest/download/niriksh.exe' },
              { platform: 'macOS', arch: 'Apple Silicon', url: 'https://github.com/Smx27/codeburn/releases/latest/download/niriksh-darwin-arm64' },
              { platform: 'macOS', arch: 'Intel', url: 'https://github.com/Smx27/codeburn/releases/latest/download/niriksh-darwin-x64' },
              { platform: 'Linux', arch: 'x86_64', url: 'https://github.com/Smx27/codeburn/releases/latest/download/niriksh-linux-x64' },
              { platform: 'Linux', arch: 'ARM64', url: 'https://github.com/Smx27/codeburn/releases/latest/download/niriksh-linux-arm64' },
            ].map((link) => (
              <div key={`${link.platform}-${link.arch}`} className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{link.platform}</span>
                  <Badge variant="default">{link.arch}</Badge>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Download
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
