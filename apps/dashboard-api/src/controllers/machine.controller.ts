import { Request, Response } from 'express';
import * as machineService from '../services/machine.service.js';
import { validateParams, MachineDetailParamsSchema } from '../validators/session.validator.js';

export async function listMachines(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const machines = await machineService.listMachines(orgId);
  res.json(machines);
}

export async function getMachine(req: Request, res: Response): Promise<void> {
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
}
