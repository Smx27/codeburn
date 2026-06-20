'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Palette,
  Building2,
  Key,
  Bell,
  Users,
  CreditCard,
  Copy,
  Plus,
  Trash2,
  Check,
  Moon,
  Sun,
  Shield,
  Loader2,
  Clock,
  UserPlus,
} from 'lucide-react';
import { listApiKeys, createApiKey, deleteApiKey } from '@/lib/api';
import type { ApiKey } from '@/types/dashboard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
        checked ? 'bg-primary' : 'bg-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function ComingSoonCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-muted p-3">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            Coming Soon
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyDigest: false,
    costAlerts: true,
    usageWarnings: true,
  });
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);

  const queryClient = useQueryClient();

  // Members queries
  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/v1/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch teams');
      const teams = await response.json();
      // Extract members from teams
      const allMembers: Array<{ id: string; name: string | null; email: string; role: string }> = [];
      for (const team of teams) {
        if (team.members) {
          for (const member of team.members) {
            if (!allMembers.find(m => m.id === member.id)) {
              allMembers.push(member);
            }
          }
        }
      }
      return allMembers;
    },
  });

  const { data: invitations } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/v1/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch invitations');
      return response.json();
    },
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/v1/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (response.ok) {
        toast.success('Invitation sent');
        setIsInviteDialogOpen(false);
        setInviteEmail('');
        setInviteRole('member');
        queryClient.invalidateQueries({ queryKey: ['invitations'] });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send invitation');
      }
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/api/v1/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Invitation resent');
    } catch {
      toast.error('Failed to resend invitation');
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/api/v1/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Invitation revoked');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    } catch {
      toast.error('Failed to revoke invitation');
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  async function loadApiKeys() {
    try {
      setLoading(true);
      const keys = await listApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }

  const handleCopyKey = (keyId: string) => {
    setCopiedKeyId(keyId);
    toast.success('API key prefix copied');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCopyNewKey = () => {
    if (newKeyResult) {
      navigator.clipboard.writeText(newKeyResult);
      setCopiedKeyId('new');
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopiedKeyId(null), 2000);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteApiKey(keyId);
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      toast.success('API key revoked');
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      setCreating(true);
      const result = await createApiKey({ name: newKeyName.trim() });
      setNewKeyResult(result.key);
      setApiKeys((prev) => [{ ...result, last_used_at: result.last_used_at ?? null, expires_at: result.expires_at ?? null }, ...prev]);
      setNewKeyName('');
      toast.success('API key created successfully');
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatLastUsed = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your dashboard preferences, API keys, and notifications
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <Palette className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Appearance</CardTitle>
              </div>
              <CardDescription>Customize the look and feel of your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground">
                    Switch between dark and light mode
                  </p>
                </div>
                <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      theme === 'dark'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      theme === 'light'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    Light
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Notifications</CardTitle>
              </div>
              <CardDescription>Configure what alerts and updates you receive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    key: 'emailAlerts' as const,
                    label: 'Email Alerts',
                    description: 'Receive email notifications for critical events',
                  },
                  {
                    key: 'weeklyDigest' as const,
                    label: 'Weekly Digest',
                    description: 'Get a weekly summary of your usage and costs',
                  },
                  {
                    key: 'costAlerts' as const,
                    label: 'Cost Alerts',
                    description: 'Alert when daily spending exceeds your threshold',
                  },
                  {
                    key: 'usageWarnings' as const,
                    label: 'Usage Warnings',
                    description: 'Warnings when approaching rate limits or quotas',
                  },
                ].map((item, i) => (
                  <div key={item.key}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Toggle
                        checked={notifications[item.key]}
                        onChange={(v) =>
                          setNotifications((prev) => ({ ...prev, [item.key]: v }))
                        }
                      />
                    </div>
                    {i < 3 && <div className="h-px bg-border/50 mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Organization</CardTitle>
              </div>
              <CardDescription>Your organization details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Plan</p>
                    <p className="text-xs text-muted-foreground">Current subscription tier</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <Shield className="h-3 w-3" />
                    Pro
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">API Keys</CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    Manage API keys for programmatic access to your data
                  </CardDescription>
                </div>
                <button
                  onClick={() => {
                    setShowNewKeyForm(!showNewKeyForm);
                    setNewKeyResult(null);
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Key
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {showNewKeyForm && (
                <div className="mb-4 rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
                  {newKeyResult ? (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-emerald-500">
                        API key created successfully. Copy it now - it won&apos;t be shown again.
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono break-all">
                          {newKeyResult}
                        </code>
                        <button
                          onClick={handleCopyNewKey}
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                          {copiedKeyId === 'new' ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setShowNewKeyForm(false);
                          setNewKeyResult(null);
                        }}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-muted-foreground">Create new API key</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Key name (e.g., Production)"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          onClick={handleCreateKey}
                          disabled={!newKeyName.trim() || creating}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create'}
                        </button>
                        <button
                          onClick={() => {
                            setShowNewKeyForm(false);
                            setNewKeyName('');
                          }}
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No API keys yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            !apiKey.expires_at || new Date(apiKey.expires_at) > new Date()
                              ? 'bg-emerald-500'
                              : 'bg-muted-foreground'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{apiKey.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <code className="font-mono">{apiKey.prefix}••••••••</code>
                            <span>&middot;</span>
                            <span>{apiKey.role}</span>
                            <span>&middot;</span>
                            <span>Created {formatDate(apiKey.created_at)}</span>
                            <span>&middot;</span>
                            <span>Last used {formatLastUsed(apiKey.last_used_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopyKey(apiKey.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Copy key prefix"
                        >
                          {copiedKeyId === apiKey.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(apiKey.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Revoke key"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Invite and manage team members for your organization
                  </p>
                </div>
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invitations && invitations.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Pending Invitations</h4>
                  <div className="space-y-2">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {invitation.role} • Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvitation(invitation.id)}
                          >
                            Resend
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvitation(invitation.id)}
                          >
                            Revoke
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {members && members.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Members</h4>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.name?.[0] || member.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.name || member.email}</p>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!members || members.length === 0) && (!invitations || invitations.length === 0) && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No team members yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Invite your first team member to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteLoading}>
                    {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send Invitation
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <ComingSoonCard
            icon={CreditCard}
            title="Billing & Subscription"
            description="Manage your subscription plan, payment methods, and view invoices."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
