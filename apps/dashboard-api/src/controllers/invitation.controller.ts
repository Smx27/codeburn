import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

export async function createInvitation(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { email, role } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const invitation = await dashboardService.createInvitation(orgId, email, role || 'member');
    if (!invitation) {
      res.status(409).json({ error: 'Invitation already exists for this email' });
      return;
    }

    res.status(201).json(invitation);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listInvitations(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const invitations = await dashboardService.listInvitations(orgId);
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function acceptInvitation(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Invitation token is required' });
      return;
    }

    const result = await dashboardService.acceptInvitation(token);
    if (!result) {
      res.status(404).json({ error: 'Invalid or expired invitation' });
      return;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function revokeInvitation(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    const id = req.params.id as string;

    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await dashboardService.revokeInvitation(orgId, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function resendInvitation(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    const id = req.params.id as string;

    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const invitation = await dashboardService.resendInvitation(orgId, id);
    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    res.json(invitation);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
