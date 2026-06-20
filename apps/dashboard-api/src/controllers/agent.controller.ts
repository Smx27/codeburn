import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

export async function registerAgent(req: Request, res: Response): Promise<void> {
  try {
    const { enrollmentKey, hostname, os, architecture, agentVersion } = req.body;

    if (!enrollmentKey || !hostname) {
      res.status(400).json({ error: 'Enrollment key and hostname are required' });
      return;
    }

    const result = await dashboardService.registerAgentEnhanced(enrollmentKey, hostname, os, architecture, agentVersion);
    if (!result) {
      res.status(401).json({ error: 'Invalid or expired enrollment key' });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function agentLogin(req: Request, res: Response): Promise<void> {
  try {
    const { apiKey, hostname, os, architecture, agentVersion } = req.body;

    if (!apiKey || !hostname) {
      res.status(400).json({ error: 'API key and hostname are required' });
      return;
    }

    const result = await dashboardService.agentLogin(apiKey, hostname, os, architecture, agentVersion);
    if (!result) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function reportSyncComplete(req: Request, res: Response): Promise<void> {
  try {
    const { agentToken, machineId, sessionsImported, providersDetected } = req.body;

    if (!agentToken || !machineId) {
      res.status(400).json({ error: 'Agent token and machine ID are required' });
      return;
    }

    // Validate agent token to get org ID
    const tokenValidation = await dashboardService.validateAgentToken(agentToken);
    if (!tokenValidation) {
      res.status(401).json({ error: 'Invalid agent token' });
      return;
    }

    // Send sync completed email (fire-and-forget)
    dashboardService.sendSyncCompletedEmail(
      tokenValidation.organizationId,
      sessionsImported || 0,
      providersDetected || []
    ).catch(() => {});

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAgentConfig(req: Request, res: Response): Promise<void> {
  try {
    const machineId = req.user?.machineId;
    if (!machineId) {
      res.status(400).json({ error: 'Machine ID not found in token' });
      return;
    }

    const config = await dashboardService.getAgentConfig(machineId);
    if (!config) {
      res.status(404).json({ error: 'Machine not found' });
      return;
    }

    res.json(config);
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
