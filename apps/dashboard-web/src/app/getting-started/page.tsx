'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  Flame,
  Check,
  ChevronRight,
  ChevronLeft,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  KeyRound,
  Download,
  Monitor,
  MonitorSmartphone,
  Terminal,
  Users,
  RefreshCw,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const STEPS = [
  { id: 'org', label: 'Organization', icon: Building2 },
  { id: 'key', label: 'Enrollment Key', icon: KeyRound },
  { id: 'install', label: 'Install Agent', icon: Download },
  { id: 'register', label: 'Register Agent', icon: Monitor },
  { id: 'sync', label: 'Verify Sync', icon: RefreshCw },
  { id: 'invite', label: 'Invite Team', icon: Users },
] as const;

type StepId = (typeof STEPS)[number]['id'];

interface Organization {
  id: string;
  name: string;
}

interface EnrollmentKey {
  id: string;
  key: string;
  name: string;
}

interface Agent {
  id: string;
  machineName: string;
  hostname: string;
  platform: string;
  lastSeen: string;
  registeredAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('aiinsight_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aiinsight_token');
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.has(index);
        const isCurrent = index === currentStep;
        const isClickable = isCompleted || isCurrent;
        const StepIcon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all',
                isCurrent && 'bg-primary text-primary-foreground shadow-glow',
                isCompleted && 'bg-success-subtle text-success hover:bg-success/10 cursor-pointer',
                !isCurrent && !isCompleted && 'bg-muted text-muted-foreground cursor-default'
              )}
            >
              {isCompleted ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <StepIcon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {index < STEPS.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5 sm:mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {label && (
        <div className="flex items-center justify-between bg-muted/50 rounded-t-lg border border-b-0 border-border px-4 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
      )}
      <div className={cn(
        'relative rounded-lg border border-border bg-background font-mono text-sm',
        label && 'rounded-t-none'
      )}>
        <pre className="overflow-x-auto p-4 text-sm">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function StepOrg({
  orgName,
  setOrgName,
  orgCreated,
  orgLoading,
  orgError,
  onCreateOrg,
}: {
  orgName: string;
  setOrgName: (v: string) => void;
  orgCreated: boolean;
  orgLoading: boolean;
  orgError: string | null;
  onCreateOrg: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <CardTitle className="text-lg">Create Your Organization</CardTitle>
        <CardDescription className="mt-1">
          Set up your workspace to start tracking AI usage across your team.
        </CardDescription>
      </div>

      {orgCreated ? (
        <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success-subtle p-4">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <div>
            <p className="text-sm font-medium text-success">Organization Created</p>
            <p className="text-xs text-success/80 mt-0.5">Your workspace is ready to use.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="org-name" className="text-sm font-medium text-foreground">
              Organization Name
            </label>
            <input
              id="org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-shadow"
            />
          </div>

          {orgError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{orgError}</span>
            </div>
          )}

          <button
            onClick={onCreateOrg}
            disabled={!orgName.trim() || orgLoading}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {orgLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function StepKey({
  enrollmentKey,
  keyLoading,
  keyError,
  keyCopied,
  keyConfirmed,
  onGenerateKey,
  onCopyKey,
  onConfirmKey,
}: {
  enrollmentKey: string | null;
  keyLoading: boolean;
  keyError: string | null;
  keyCopied: boolean;
  keyConfirmed: boolean;
  onGenerateKey: () => void;
  onCopyKey: () => void;
  onConfirmKey: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <CardTitle className="text-lg">Generate Enrollment Key</CardTitle>
        <CardDescription className="mt-1">
          This key authenticates your agents when they connect to the dashboard.
        </CardDescription>
      </div>

      {!enrollmentKey ? (
        <div className="space-y-4">
          {keyError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{keyError}</span>
            </div>
          )}

          <button
            onClick={onGenerateKey}
            disabled={keyLoading}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {keyLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                Generate Enrollment Key
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-warning/20 bg-warning-subtle p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Save this key now</p>
                <p className="text-xs text-warning/80 mt-0.5">
                  This key will not be shown again after you leave this page.
                </p>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="flex items-center rounded-lg border border-border bg-background font-mono text-sm">
              <span className="flex-1 overflow-x-auto p-4 select-all">{enrollmentKey}</span>
              <button
                onClick={onCopyKey}
                className="shrink-0 p-4 text-muted-foreground hover:text-foreground transition-colors border-l border-border"
                title="Copy to clipboard"
              >
                {keyCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!keyConfirmed ? (
            <button
              onClick={onConfirmKey}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Check className="mr-2 h-4 w-4" />
              I&apos;ve Saved My Key
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Key saved — you can proceed.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepInstall() {
  const [activeTab, setActiveTab] = useState<'windows' | 'macos' | 'linux'>('windows');

  const tabs = [
    { id: 'windows' as const, label: 'Windows', icon: Monitor },
    { id: 'macos' as const, label: 'macOS', icon: MonitorSmartphone },
    { id: 'linux' as const, label: 'Linux', icon: Terminal },
  ];

  return (
    <div className="space-y-6">
      <div>
        <CardTitle className="text-lg">Install AIInsight Agent</CardTitle>
        <CardDescription className="mt-1">
          Install the agent on the machines you want to monitor.
        </CardDescription>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors flex-1 justify-center',
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {activeTab === 'windows' && (
          <>
            <CodeBlock
              label="Download and install"
              code="curl -fsSL https://get.aiinsight.dev/install.sh | bash"
            />
            <CodeBlock
              label="Or with winget"
              code="winget install AIInsight.CLI"
            />
          </>
        )}
        {activeTab === 'macos' && (
          <>
            <CodeBlock
              label="Install with Homebrew"
              code="brew install aiinsight/tap/aiinsight"
            />
            <CodeBlock
              label="Or with curl"
              code="curl -fsSL https://get.aiinsight.dev/install.sh | bash"
            />
          </>
        )}
        {activeTab === 'linux' && (
          <>
            <CodeBlock
              label="Install with curl"
              code="curl -fsSL https://get.aiinsight.dev/install.sh | bash"
            />
            <CodeBlock
              label="Or with apt (Debian/Ubuntu)"
              code="sudo apt install aiinsight"
            />
          </>
        )}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          After installation, verify the agent is installed correctly by running:{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            aiinsight --version
          </code>
        </p>
      </div>
    </div>
  );
}

function StepRegister({
  enrollmentKey,
  pasteKey,
  setPasteKey,
  connectionStatus,
  connectionError,
  onTestConnection,
}: {
  enrollmentKey: string | null;
  pasteKey: string;
  setPasteKey: (v: string) => void;
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  connectionError: string | null;
  onTestConnection: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <CardTitle className="text-lg">Register Your Agent</CardTitle>
        <CardDescription className="mt-1">
          Connect your first machine to the dashboard.
        </CardDescription>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">How to register:</p>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Run the agent on your machine</li>
          <li>Use your enrollment key when prompted</li>
          <li>Click &quot;Test Connection&quot; below to verify</li>
        </ol>
      </div>

      <div className="space-y-2">
        <label htmlFor="enrollment-key" className="text-sm font-medium text-foreground">
          Enrollment Key
        </label>
        <input
          id="enrollment-key"
          type="text"
          value={pasteKey}
          onChange={(e) => setPasteKey(e.target.value)}
          placeholder={enrollmentKey || 'Paste your enrollment key'}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-shadow"
        />
        {enrollmentKey && (
          <p className="text-xs text-muted-foreground">
            Key from step 2 is pre-filled. You can also paste a different key.
          </p>
        )}
      </div>

      <button
        onClick={onTestConnection}
        disabled={!pasteKey.trim() || connectionStatus === 'testing'}
        className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-card-elevated focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {connectionStatus === 'testing' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Test Connection
          </>
        )}
      </button>

      {connectionStatus === 'success' && (
        <div className="flex items-center gap-2 rounded-lg bg-success-subtle border border-success/20 p-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Agent is connected and ready.
        </div>
      )}

      {connectionStatus === 'error' && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{connectionError || 'No agents found. Make sure the agent is running and registered.'}</span>
        </div>
      )}
    </div>
  );
}

function StepSync({
  agents,
  syncLoading,
  lastChecked,
  onCheckSync,
}: {
  agents: Agent[];
  syncLoading: boolean;
  lastChecked: string | null;
  onCheckSync: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <CardTitle className="text-lg">Verify Sync</CardTitle>
        <CardDescription className="mt-1">
          Confirm that your agents are connected and data is flowing.
        </CardDescription>
      </div>

      <button
        onClick={onCheckSync}
        disabled={syncLoading}
        className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-card-elevated focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {syncLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Sync Status
          </>
        )}
      </button>

      {agents.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} connected
          </p>
          <div className="space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-success-subtle">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{agent.machineName || agent.hostname}</p>
                    <p className="text-xs text-muted-foreground">{agent.platform}</p>
                  </div>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
            ))}
          </div>
          {lastChecked && (
            <p className="text-xs text-muted-foreground">Last checked: {lastChecked}</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center space-y-2">
          <Monitor className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            No agents detected yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Historical sync will begin automatically after agent registration.
          </p>
        </div>
      )}
    </div>
  );
}

function StepInvite({
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  invitations,
  inviteLoading,
  inviteError,
  inviteSuccess,
  onSendInvite,
}: {
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteRole: string;
  setInviteRole: (v: string) => void;
  invitations: Invitation[];
  inviteLoading: boolean;
  inviteError: string | null;
  inviteSuccess: boolean;
  onSendInvite: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <CardTitle className="text-lg">Invite Your Team</CardTitle>
        <CardDescription className="mt-1">
          Add team members so they can view AI usage analytics.
        </CardDescription>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-shadow"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-shadow"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {inviteError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{inviteError}</span>
          </div>
        )}

        {inviteSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-success-subtle border border-success/20 p-3 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Invitation sent successfully.
          </div>
        )}

        <button
          onClick={onSendInvite}
          disabled={!inviteEmail.trim() || inviteLoading}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {inviteLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Invitation'
          )}
        </button>
      </div>

      {invitations.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Pending Invitations</p>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{inv.role}</p>
                </div>
                <Badge variant={inv.status === 'pending' ? 'warning' : 'success'}>
                  {inv.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GettingStartedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Step 1: Org
  const [orgName, setOrgName] = useState('');
  const [orgCreated, setOrgCreated] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  // Step 2: Key
  const [enrollmentKey, setEnrollmentKey] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [keyConfirmed, setKeyConfirmed] = useState(false);

  // Step 4: Register
  const [pasteKey, setPasteKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Step 5: Sync
  const [agents, setAgents] = useState<Agent[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Step 6: Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.organizationId) {
      setOrgCreated(true);
      setOrgName(user.name || '');
      setCompletedSteps((prev) => new Set([...prev, 0]));
      setCurrentStep(1);
    }
  }, [user]);

  const markComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const handleCreateOrg = async () => {
    setOrgLoading(true);
    setOrgError(null);
    try {
      await apiFetch('/api/v1/organizations/', {
        method: 'POST',
        body: JSON.stringify({ name: orgName.trim() }),
      });
      setOrgCreated(true);
      markComplete(0);
      setCurrentStep(1);
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setOrgLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    setKeyLoading(true);
    setKeyError(null);
    try {
      const result = await apiFetch<{ id: string; key: string; name: string }>(
        '/api/v1/enrollment-keys/',
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Default' }),
        }
      );
      setEnrollmentKey(result.key);
      setPasteKey(result.key);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Failed to generate key');
    } finally {
      setKeyLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (enrollmentKey) {
      await navigator.clipboard.writeText(enrollmentKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    }
  };

  const handleConfirmKey = () => {
    setKeyConfirmed(true);
    markComplete(1);
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setConnectionError(null);
    try {
      const result = await apiFetch<{ agents: Agent[] }>('/api/v1/agents/');
      const agentList = Array.isArray(result) ? result : (result.agents || []);
      if (agentList.length > 0) {
        setConnectionStatus('success');
        setAgents(agentList);
        markComplete(3);
      } else {
        setConnectionStatus('error');
        setConnectionError('No agents found. Make sure the agent is running and registered.');
      }
    } catch (err) {
      setConnectionStatus('error');
      setConnectionError(err instanceof Error ? err.message : 'Connection test failed');
    }
  };

  const handleCheckSync = async () => {
    setSyncLoading(true);
    try {
      const result = await apiFetch<{ agents: Agent[] }>('/api/v1/agents/');
      const agentList = Array.isArray(result) ? result : (result.agents || []);
      setAgents(agentList);
      setLastChecked(new Date().toLocaleTimeString());
      if (agentList.length > 0) {
        markComplete(4);
      }
    } catch {
      // silent
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSendInvite = async () => {
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);
    try {
      await apiFetch('/api/v1/invitations/', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      setInviteSuccess(true);
      setInviteEmail('');

      const result = await apiFetch<{ invitations: Invitation[] }>('/api/v1/invitations/');
      const list = Array.isArray(result) ? result : (result.invitations || []);
      setInvitations(list);
      markComplete(5);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleNext = () => {
    if (currentStep === 1 && !keyConfirmed) return;
    if (currentStep < STEPS.length - 1) {
      markComplete(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="container-dashboard flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary shadow-glow">
                <Flame className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">AIInsight</span>
            </div>
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip to Dashboard
            </a>
          </div>
        </header>

        {/* Progress */}
        <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm py-3">
          <div className="container-dashboard">
            <StepIndicator
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={goToStep}
            />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 flex items-start justify-center py-8 sm:py-12">
          <div className="w-full max-w-lg px-4 animate-fade-in-up">
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-6 sm:p-8">
                {currentStep === 0 && (
                  <StepOrg
                    orgName={orgName}
                    setOrgName={setOrgName}
                    orgCreated={orgCreated}
                    orgLoading={orgLoading}
                    orgError={orgError}
                    onCreateOrg={handleCreateOrg}
                  />
                )}
                {currentStep === 1 && (
                  <StepKey
                    enrollmentKey={enrollmentKey}
                    keyLoading={keyLoading}
                    keyError={keyError}
                    keyCopied={keyCopied}
                    keyConfirmed={keyConfirmed}
                    onGenerateKey={handleGenerateKey}
                    onCopyKey={handleCopyKey}
                    onConfirmKey={handleConfirmKey}
                  />
                )}
                {currentStep === 2 && <StepInstall />}
                {currentStep === 3 && (
                  <StepRegister
                    enrollmentKey={enrollmentKey}
                    pasteKey={pasteKey}
                    setPasteKey={setPasteKey}
                    connectionStatus={connectionStatus}
                    connectionError={connectionError}
                    onTestConnection={handleTestConnection}
                  />
                )}
                {currentStep === 4 && (
                  <StepSync
                    agents={agents}
                    syncLoading={syncLoading}
                    lastChecked={lastChecked}
                    onCheckSync={handleCheckSync}
                  />
                )}
                {currentStep === 5 && (
                  <StepInvite
                    inviteEmail={inviteEmail}
                    setInviteEmail={setInviteEmail}
                    inviteRole={inviteRole}
                    setInviteRole={setInviteRole}
                    invitations={invitations}
                    inviteLoading={inviteLoading}
                    inviteError={inviteError}
                    inviteSuccess={inviteSuccess}
                    onSendInvite={handleSendInvite}
                  />
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              {currentStep > 0 ? (
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={currentStep === 1 && !keyConfirmed}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </button>
              ) : (
                <a
                  href="/"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
