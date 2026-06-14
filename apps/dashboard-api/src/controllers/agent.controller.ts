import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

export async function registerAgent(req: Request, res: Response): Promise<void> {
  try {
    const { enrollmentKey, hostname, os, architecture, agentVersion } = req.body;

    if (!enrollmentKey || !hostname) {
      res.status(400).json({ error: 'Enrollment key and hostname are required' });
      return;
    }

    const result = await dashboardService.registerAgent(enrollmentKey, hostname, os, architecture, agentVersion);
    if (!result) {
      res.status(401).json({ error: 'Invalid or expired enrollment key' });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function heartbeat(req: Request, res: Response): Promise<void> {
  try {
    const { agentToken, machineId } = req.body;

    if (!agentToken || !machineId) {
      res.status(400).json({ error: 'Agent token and machine ID are required' });
      return;
    }

    const result = await dashboardService.agentHeartbeat(agentToken, machineId);
    if (!result) {
      res.status(401).json({ error: 'Invalid agent token' });
      return;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listAgents(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const agents = await dashboardService.listAgents(orgId);
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAgent(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    const id = req.params.id as string;

    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const agent = await dashboardService.getAgent(orgId, id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
