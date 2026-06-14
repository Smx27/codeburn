import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

export async function listTeams(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const teams = await dashboardService.listTeams(orgId);
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createTeam(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Team name is required' });
      return;
    }

    const team = await dashboardService.createTeam(orgId, name, description);
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateTeam(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    const id = req.params.id as string;
    const { name, description } = req.body;

    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await dashboardService.updateTeam(orgId, id, name, description);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteTeam(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    const id = req.params.id as string;

    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await dashboardService.deleteTeam(orgId, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addTeamMember(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    const id = req.params.id as string;
    const { userId, role } = req.body;

    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    await dashboardService.addTeamMember(orgId, id, userId, role || 'member');
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeTeamMember(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    const id = req.params.id as string;
    const userId = req.params.userId as string;

    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await dashboardService.removeTeamMember(orgId, id, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
