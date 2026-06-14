'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, X, KeyRound, Monitor, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnboardingProgress } from '@/hooks/useDashboard';
import type { OnboardingSteps } from '@/types/dashboard';

const DISMISS_KEY = 'aiinsight_onboarding_dismissed';

interface StepDef {
  key: keyof OnboardingSteps;
  label: string;
  icon: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  autoCheck?: boolean;
}

const STEPS: StepDef[] = [
  {
    key: 'organizationCreated',
    label: 'Organization Created',
    icon: <Check className="h-4 w-4" />,
    autoCheck: true,
  },
  {
    key: 'enrollmentKeyGenerated',
    label: 'Generate Enrollment Key',
    icon: <KeyRound className="h-4 w-4" />,
    actionLabel: 'Create',
    actionHref: '/settings/agents',
  },
  {
    key: 'agentInstalled',
    label: 'Install Agent',
    icon: <Monitor className="h-4 w-4" />,
    actionLabel: 'Install',
    actionHref: '/getting-started',
  },
  {
    key: 'syncRunning',
    label: 'Agent Connected',
    icon: <Check className="h-4 w-4" />,
    autoCheck: true,
  },
  {
    key: 'syncComplete',
    label: 'Historical Sync Complete',
    icon: <Check className="h-4 w-4" />,
    autoCheck: true,
  },
  {
    key: 'teamInvited',
    label: 'Invite Team',
    icon: <Users className="h-4 w-4" />,
    actionLabel: 'Invite',
    actionHref: '/getting-started',
  },
];

function OnboardingStepItem({
  step,
  completed,
}: {
  step: StepDef;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
          completed
            ? 'border-success bg-success text-success-foreground'
            : 'border-border bg-muted text-muted-foreground'
        }`}
      >
        {completed ? <Check className="h-3.5 w-3.5" /> : step.icon}
      </div>
      <span
        className={`flex-1 text-sm ${
          completed ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {step.label}
      </span>
      {!completed && step.actionLabel && step.actionHref && (
        <Link
          href={step.actionHref}
          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          {step.actionLabel}
          <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export function OnboardingProgress() {
  const { data, isLoading } = useOnboardingProgress();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
    } catch {
      // SSR or storage error
    }
  }, []);

  if (isLoading || !data || dismissed || data.completionPercentage >= 100) {
    return null;
  }

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  return (
    <Card className="animate-fade-in-up">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Getting Started</CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-primary">
            {data.completionPercentage}%
          </span>
          <button
            onClick={handleDismiss}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Dismiss onboarding"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Progress bar */}
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${data.completionPercentage}%` }}
          />
        </div>

        {/* Steps */}
        <div className="divide-y divide-border">
          {STEPS.map((step) => (
            <OnboardingStepItem
              key={step.key}
              step={step}
              completed={data.steps[step.key]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
