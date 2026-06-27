import { Request, Response } from 'express';
import * as dashboardRepo from '../repositories/dashboard.repository.js';

const ONBOARDING_STEPS = [
  'organizationCreated',
  'enrollmentKeyGenerated',
  'agentInstalled',
  'syncRunning',
  'syncComplete',
  'teamInvited',
] as const;

export async function getOnboardingProgress(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const steps = await dashboardRepo.getOnboardingProgress(orgId);

  const completedCount = ONBOARDING_STEPS.filter((key) => steps[key]).length;
  const completionPercentage = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);

  res.json({ steps, completionPercentage });
}
