import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';
import { OverviewQuerySchema, AnalyticsQuerySchema, TrendQuerySchema, validateQuery } from '../validators/query.validator.js';

export async function getOverview(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const { period } = validateQuery(OverviewQuerySchema, req.query);
  const overview = await dashboardService.getOverview(orgId, period);
  res.json(overview);
}

export async function getProviders(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const { period } = validateQuery(OverviewQuerySchema, req.query);
  const providers = await dashboardService.getProviderAnalytics(orgId, period);
  res.json(providers);
}

export async function getModels(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const { period, limit } = validateQuery(AnalyticsQuerySchema, req.query);
  const models = await dashboardService.getModelAnalytics(orgId, period, limit);
  res.json(models);
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const { period, limit } = validateQuery(AnalyticsQuerySchema, req.query);
  const users = await dashboardService.getUserAnalytics(orgId, period, limit);
  res.json(users);
}

export async function getProjects(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const { period, limit } = validateQuery(AnalyticsQuerySchema, req.query);
  const projects = await dashboardService.getProjectAnalytics(orgId, period, limit);
  res.json(projects);
}

export async function getTrends(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const { period, granularity } = validateQuery(TrendQuerySchema, req.query);
  const trends = await dashboardService.getTrends(orgId, period, granularity);
  res.json({ granularity, data: trends });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const result = await dashboardService.login(email, password);
  if (!result) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  res.json(result);
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const result = await dashboardService.refreshToken(userId);
  if (!result) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  res.json(result);
}

export async function triggerBackfill(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  if (req.user?.role !== 'org_admin') {
    res.status(403).json({ error: 'Org admin access required' });
    return;
  }

  const result = await dashboardService.runBackfill(orgId);
  res.json({ message: 'Backfill started', result });
}

export async function getOrganizationOverview(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const { query } = await import('../database/pool.js');
  const overview = await query<{ users: string; teams: string; machines: string; providers: string; sessions: string; events: string }>(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE organization_id = $1) as users,
       (SELECT COUNT(*) FROM teams WHERE organization_id = $1) as teams,
       (SELECT COUNT(*) FROM machines WHERE organization_id = $1) as machines,
       (SELECT COUNT(DISTINCT provider_id) FROM sessions WHERE organization_id = $1) as providers,
       (SELECT COUNT(*) FROM sessions WHERE organization_id = $1) as sessions,
       (SELECT COUNT(*) FROM events WHERE organization_id = $1) as events`,
    [orgId]
  );

  res.json({
    users: parseInt(overview[0]?.users ?? '0', 10),
    teams: parseInt(overview[0]?.teams ?? '0', 10),
    machines: parseInt(overview[0]?.machines ?? '0', 10),
    providers: parseInt(overview[0]?.providers ?? '0', 10),
    sessions: parseInt(overview[0]?.sessions ?? '0', 10),
    events: parseInt(overview[0]?.events ?? '0', 10),
  });
}

export async function getAgents(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const agents = await dashboardService.listAgents(orgId);
  res.json(agents);
}

export async function getSyncJobs(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const { query } = await import('../database/pool.js');
  const jobs = await query<{ id: string; machine_id: string; provider: string; started_at: string; completed_at: string | null; records_processed: number; status: string }>(
    `SELECT sj.id, sj.machine_id, sj.provider, sj.started_at, sj.completed_at, sj.records_processed, sj.status
     FROM sync_jobs sj
     JOIN machines m ON sj.machine_id = m.id
     WHERE m.organization_id = $1
     ORDER BY sj.started_at DESC
     LIMIT 50`,
    [orgId]
  );
  res.json(jobs);
}

export async function getOnboardingStatus(req: Request, res: Response): Promise<void> {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ error: 'Organization not found' });
    return;
  }

  const { queryOne } = await import('../database/pool.js');

  const hasUsers = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM users WHERE organization_id = $1`,
    [orgId]
  );

  const hasTeams = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM teams WHERE organization_id = $1`,
    [orgId]
  );

  const hasEnrollmentKeys = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM organization_enrollment_keys WHERE organization_id = $1`,
    [orgId]
  );

  const hasMachines = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM machines WHERE organization_id = $1`,
    [orgId]
  );

  const hasSessions = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM sessions WHERE organization_id = $1`,
    [orgId]
  );

  res.json({
    hasOrganization: true,
    hasUsers: parseInt(hasUsers?.count ?? '0', 10) > 0,
    hasTeams: parseInt(hasTeams?.count ?? '0', 10) > 0,
    hasEnrollmentKeys: parseInt(hasEnrollmentKeys?.count ?? '0', 10) > 0,
    hasMachines: parseInt(hasMachines?.count ?? '0', 10) > 0,
    hasSessions: parseInt(hasSessions?.count ?? '0', 10) > 0,
  });
}
