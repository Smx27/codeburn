'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Settings,
  Palette,
  Building2,
  Key,
  Bell,
  Copy,
  Plus,
  Trash2,
  Check,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  active: boolean;
}

const PLACEHOLDER_API_KEYS: ApiKey[] = [
  {
    id: 'key_1',
    name: 'Production',
    key: 'cb_prod_••••••••••••••••••••••••',
    createdAt: '2025-01-15',
    lastUsed: '2 hours ago',
    active: true,
  },
  {
    id: 'key_2',
    name: 'Staging',
    key: 'cb_stg_••••••••••••••••••••••••',
    createdAt: '2025-02-20',
    lastUsed: '3 days ago',
    active: true,
  },
  {
    id: 'key_3',
    name: 'Development',
    key: 'cb_dev_••••••••••••••••••••••••',
    createdAt: '2025-03-10',
    lastUsed: '1 week ago',
    active: false,
  },
];

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

export function SettingsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [orgName] = useState('AiInsight Cloud');
  const [apiKeys, setApiKeys] = useState(PLACEHOLDER_API_KEYS);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyDigest: false,
    costAlerts: true,
    usageWarnings: true,
  });

  const handleCopyKey = (keyId: string) => {
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleDeleteKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      key: `cb_${Math.random().toString(36).slice(2, 6)}_••••••••••••••••••••••••`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      active: true,
    };
    setApiKeys((prev) => [...prev, newKey]);
    setNewKeyName('');
    setShowNewKeyForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your dashboard preferences, API keys, and notifications
        </p>
      </div>

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
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Organization</CardTitle>
          </div>
          <CardDescription>Your organization details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Organization Name</p>
                <p className="text-xs text-muted-foreground">
                  Displayed across the dashboard
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{orgName}</span>
                <button className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors">
                  Edit
                </button>
              </div>
            </div>
            <div className="h-px bg-border/50" />
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
              onClick={() => setShowNewKeyForm(!showNewKeyForm)}
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
                  disabled={!newKeyName.trim()}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Create
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
            </div>
          )}

          <div className="space-y-2">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      apiKey.active ? 'bg-emerald-500' : 'bg-muted-foreground'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{apiKey.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <code className="font-mono">{apiKey.key}</code>
                      <span>&middot;</span>
                      <span>Created {apiKey.createdAt}</span>
                      <span>&middot;</span>
                      <span>Last used {apiKey.lastUsed}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopyKey(apiKey.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Copy key"
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
                    title="Delete key"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
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
    </div>
  );
}
