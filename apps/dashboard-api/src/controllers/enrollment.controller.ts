import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

export async function generateKey(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { name, expiresAt } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Key name is required' });
      return;
    }

    const result = await dashboardService.generateEnrollmentKey(orgId, name, expiresAt);
    if (!result) {
      res.status(500).json({ error: 'Failed to generate key' });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listKeys(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const keys = await dashboardService.listEnrollmentKeys(orgId);
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function revokeKey(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    const id = req.params.id as string;

    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await dashboardService.revokeEnrollmentKey(orgId, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function rotateKey(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    const id = req.params.id as string;

    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await dashboardService.rotateEnrollmentKey(orgId, id);
    if (!result) {
      res.status(404).json({ error: 'Key not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
