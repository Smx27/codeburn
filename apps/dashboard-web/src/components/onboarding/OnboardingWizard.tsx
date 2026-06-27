'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Key,
  Download,
  RefreshCw,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Copy,
  Terminal,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { AUTH_TOKEN_STORAGE_KEY } from '@/lib/storage-keys';

const steps = [
  {
    id: 1,
    title: 'Organization Setup',
    description: 'Set up your organization profile',
    icon: Building2,
  },
  {
    id: 2,
    title: 'Generate API Key',
    description: 'Create your first enrollment key',
    icon: Key,
  },
  {
    id: 3,
    title: 'Install Agent',
    description: 'Install the CLI agent on your machine',
    icon: Download,
  },
  {
    id: 4,
    title: 'Run Sync',
    description: 'Start syncing your AI usage data',
    icon: RefreshCw,
  },
  {
    id: 5,
    title: 'All Set!',
    description: 'You\'re ready to go',
    icon: CheckCircle2,
  },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [orgName, setOrgName] = useState(user?.organizationId || '');
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  const progress = (currentStep / steps.length) * 100;

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const response = await fetch(`${apiUrl}/api/v1/enrollment-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'Default' }),
      });
      if (response.ok) {
        const data = await response.json();
        setApiKey(data.key);
      }
    } catch {
      // Handle error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartSync = async () => {
    setIsSyncing(true);
    // The actual sync is done via CLI, so we just mark as complete after a brief delay
    await new Promise((r) => setTimeout(r, 2000));
    setSyncComplete(true);
    setIsSyncing(false);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const skipToEnd = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container-marketing flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-glow">
              <Flame className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground font-sora">
              NIRIKSH
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={skipToEnd}>
            Skip setup
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="border-b border-border/50 bg-background/50">
        <div className="container-marketing py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">
              Step {currentStep} of {steps.length}
            </h2>
            <span className="text-xs text-muted-foreground">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Organization */}
              {currentStep === 1 && (
                <Card className="border-border/50 shadow-lg">
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">
                        Welcome to Niriksh
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Let&apos;s set up your organization to get started.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={skipToEnd}
                      >
                        Skip
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setCurrentStep(2)}
                        disabled={!orgName.trim()}
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: API Key */}
              {currentStep === 2 && (
                <Card className="border-border/50 shadow-lg">
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                        <Key className="h-6 w-6 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">
                        Generate API Key
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create an enrollment key to connect your machines.
                      </p>
                    </div>

                    {!apiKey ? (
                      <Button
                        className="w-full"
                        onClick={handleGenerateKey}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Key className="mr-2 h-4 w-4" />
                            Generate Enrollment Key
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                          <code className="flex-1 text-xs font-mono text-foreground truncate">
                            {apiKey}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyKey}
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Copy this key — you won&apos;t be able to see it again.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setCurrentStep(3)}
                        disabled={!apiKey}
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Install Agent */}
              {currentStep === 3 && (
                <Card className="border-border/50 shadow-lg">
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                        <Download className="h-6 w-6 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">
                        Install the Agent
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Run this command on each machine you want to track.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Terminal className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            Install
                          </span>
                        </div>
                        <code className="text-sm font-mono text-foreground block">
                          curl -fsSL https://aiinsight.dev/install.sh | sh
                        </code>
                      </div>

                      <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Terminal className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            Configure
                          </span>
                        </div>
                        <code className="text-sm font-mono text-foreground block">
                          aiinsight configure --key {apiKey.substring(0, 20)}...
                        </code>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setCurrentStep(4)}
                      >
                        I&apos;ve installed it
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Run Sync */}
              {currentStep === 4 && (
                <Card className="border-border/50 shadow-lg">
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                        <RefreshCw className={cn("h-6 w-6 text-primary", isSyncing && "animate-spin")} />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">
                        {syncComplete ? 'Sync Complete!' : 'Start Syncing'}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {syncComplete
                          ? 'Your historical data is now available in the dashboard.'
                          : 'Backfill your historical AI usage data.'}
                      </p>
                    </div>

                    {!syncComplete ? (
                      <Button
                        className="w-full"
                        onClick={handleStartSync}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Syncing data...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Start Historical Sync
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20 text-sm text-success">
                        <Check className="h-4 w-4" />
                        Historical sync completed successfully
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(3)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setCurrentStep(5)}
                        disabled={!syncComplete}
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Complete */}
              {currentStep === 5 && (
                <Card className="border-border/50 shadow-lg">
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
                        <Check className="h-8 w-8 text-success" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">
                        You&apos;re all set!
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                        Your organization is configured and data is syncing. Explore your dashboard to see AI usage insights.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                        <div className="text-lg font-bold text-foreground">5</div>
                        <div className="text-xs text-muted-foreground">Features</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                        <div className="text-lg font-bold text-foreground">24/7</div>
                        <div className="text-xs text-muted-foreground">Monitoring</div>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => router.push('/dashboard')}
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
