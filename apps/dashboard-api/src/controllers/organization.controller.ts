import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

export async function createOrganization(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Organization name is required' });
    return;
  }

  const org = await dashboardService.createOrganization(name, userId);
  if (!org) {
    res.status(409).json({ error: 'Organization already exists' });
    return;
  }

  res.status(201).json(org);
}

export async function getCurrentOrganization(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const org = await dashboardService.getOrganization(orgId);
  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  res.json(org);
}

export async function updateCurrentOrganization(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { name, settings } = req.body;
  await dashboardService.updateOrganization(orgId, name, settings);

  res.json({ success: true });
}
