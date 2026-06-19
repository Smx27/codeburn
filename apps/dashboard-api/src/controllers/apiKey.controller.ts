import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';
import { CreateApiKeySchema, ApiKeyParamsSchema, validateBody } from '../validators/apiKey.validator.js';

export async function listApiKeys(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const keys = await dashboardService.listApiKeys(orgId);
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createApiKey(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { name, role, expiresAt } = validateBody(CreateApiKeySchema, req.body);
    const result = await dashboardService.createApiKey(orgId, name, role, expiresAt);
    if (!result) {
      res.status(500).json({ error: 'Failed to create API key' });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Validation error')) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteApiKey(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = validateBody(ApiKeyParamsSchema, req.params);
    await dashboardService.deleteApiKey(orgId, id);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Validation error')) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}
