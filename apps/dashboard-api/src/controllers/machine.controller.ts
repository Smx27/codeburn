import { Request, Response } from 'express';
import pino from 'pino';
import * as machineService from '../services/machine.service.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
import { validateParams, MachineDetailParamsSchema } from '../validators/session.validator.js';

export async function listMachines(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Organization not found' });
      return;
    }

    const machines = await machineService.listMachines(orgId);
    res.json(machines);
  } catch (error) {
    logger.error({ err: error, endpoint: 'listMachines' }, 'Machine error');
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMachine(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Organization not found' });
      return;
    }

    const { id } = validateParams(MachineDetailParamsSchema, req.params);
    const detail = await machineService.getMachineDetail(orgId, id);
    if (!detail) {
      res.status(404).json({ error: 'Machine not found' });
      return;
    }

    res.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid parameters')) {
      res.status(400).json({ error: error.message });
      return;
    }
    logger.error({ err: error, endpoint: 'getMachine' }, 'Machine error');
    res.status(500).json({ error: 'Internal server error' });
  }
}
