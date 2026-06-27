import { Request, Response } from 'express';
import * as sessionService from '../services/session.service.js';
import { SessionListQuerySchema, validateQuery, validateParams, SessionDetailParamsSchema } from '../validators/session.validator.js';

export async function listSessions(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const filters = validateQuery(SessionListQuerySchema, req.query);
  const result = await sessionService.listSessions(orgId, filters);
  res.json(result);
}

export async function getSession(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const { id } = validateParams(SessionDetailParamsSchema, req.params);
  const session = await sessionService.getSessionDetail(orgId, id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.json(session);
}
