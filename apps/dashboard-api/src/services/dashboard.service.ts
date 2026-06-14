import * as dashboardRepo from '../repositories/dashboard.repository.js';
import { signToken } from '../middlewares/auth.middleware.js';
import { query, queryOne } from '../database/pool.js';
import argon2 from 'argon2';
import crypto from 'crypto';

export async function getOverview(orgId: string, period: string) {
  return dashboardRepo.getOverview(orgId, period);
}

export async function getProviderAnalytics(orgId: string, period: string) {
  return dashboardRepo.getProviderAnalytics(orgId, period);
}

export async function getModelAnalytics(orgId: string, period: string, limit?: number) {
  return dashboardRepo.getModelAnalytics(orgId, period, limit);
}

export async function getUserAnalytics(orgId: string, period: string, limit?: number) {
  return dashboardRepo.getUserAnalytics(orgId, period, limit);
}

export async function getProjectAnalytics(orgId: string, period: string, limit?: number) {
  return dashboardRepo.getProjectAnalytics(orgId, period, limit);
}

export async function getTrends(orgId: string, period: string, granularity: 'daily' | 'weekly' | 'monthly') {
  return dashboardRepo.getTrends(orgId, period, granularity);
}

export async function login(email: string, password: string) {
  const user = await dashboardRepo.getUserWithPasswordByEmail(email);
  if (!user) {
    return null;
  }

  const passwordValid = await argon2.verify(user.password_hash, password);
  if (!passwordValid) {
    return null;
  }

  await dashboardRepo.updateUserLastLogin(user.id);

  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: user.organization_id,
    role: user.role,
  });

  const refreshToken = await generateRefreshToken(user.id);

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organization_id,
      role: user.role,
    },
  };
}

export async function refreshToken(refreshTokenValue: string) {
  const tokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
  const tokenRecord = await dashboardRepo.getRefreshTokenByHash(tokenHash);

  if (!tokenRecord) {
    return null;
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    await dashboardRepo.deleteRefreshToken(tokenHash);
    return null;
  }

  await dashboardRepo.deleteRefreshToken(tokenHash);

  const user = await dashboardRepo.getUserById(tokenRecord.user_id);
  if (!user) {
    return null;
  }

  const newToken = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: user.organization_id,
    role: user.role,
  });

  const newRefreshToken = await generateRefreshToken(user.id);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organization_id,
      role: user.role,
    },
  };
}

export async function logout(userId: string): Promise<void> {
  await dashboardRepo.deleteRefreshTokensForUser(userId);
}

export async function register(email: string, password: string, name: string | null, organizationName: string) {
  const existingUser = await dashboardRepo.getUserWithPasswordByEmail(email);
  if (existingUser) {
    return null;
  }

  const passwordHash = await argon2.hash(password);

  const org = await dashboardRepo.createOrganization(organizationName);
  await dashboardRepo.createOrganizationSettings(org.id);

  const user = await dashboardRepo.createUser(email, passwordHash, name, org.id, 'owner');

  const defaultTeam = await dashboardRepo.createTeam(org.id, 'General', 'Default team');
  await dashboardRepo.createTeamMember(defaultTeam.id, user.id, 'admin');

  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: user.organization_id,
    role: user.role,
  });

  const refreshToken = await generateRefreshToken(user.id);

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organization_id,
      role: user.role,
    },
    organization: {
      id: org.id,
      name: org.name,
    },
  };
}

async function generateRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await dashboardRepo.createRefreshToken(userId, tokenHash, expiresAt);
  return token;
}

export async function runBackfill(organizationId: string) {
  const { createAnalyticsService } = await import('@aiinsight/analytics-engine');
  const service = createAnalyticsService({ databaseUrl: process.env.DATABASE_URL! });
  try {
    return await service.runHistoricalBackfill(organizationId);
  } finally {
    await service.shutdown();
  }
}

export async function runDailyAggregation(organizationId: string, date: Date) {
  const { createAnalyticsService } = await import('@aiinsight/analytics-engine');
  const service = createAnalyticsService({ databaseUrl: process.env.DATABASE_URL! });
  try {
    return await service.runDailyAggregation(organizationId, date);
  } finally {
    await service.shutdown();
  }
}

export async function createOrganization(name: string, userId: string) {
  const org = await dashboardRepo.createOrganization(name);
  await dashboardRepo.createOrganizationSettings(org.id);
  return org;
}

export async function getOrganization(orgId: string) {
  const org = await dashboardRepo.getOrganizationById(orgId);
  if (!org) return null;

  const settings = await dashboardRepo.getOrganizationSettings(orgId);
  const counts = await dashboardRepo.getOrganizationCounts(orgId);

  return { ...org, settings, counts };
}

export async function updateOrganization(orgId: string, name?: string, settings?: { timezone?: string; currency?: string; retention_days?: number }) {
  if (name) {
    await dashboardRepo.updateOrganization(orgId, name);
  }
  if (settings) {
    await dashboardRepo.updateOrganizationSettings(orgId, settings);
  }
}

export async function listTeams(orgId: string) {
  return query<{ id: string; name: string; description: string | null; created_at: string }>(
    `SELECT id, name, description, created_at FROM teams WHERE organization_id = $1 ORDER BY name`,
    [orgId]
  );
}

export async function createTeam(orgId: string, name: string, description: string | null = null) {
  return dashboardRepo.createTeam(orgId, name, description);
}

export async function updateTeam(orgId: string, teamId: string, name?: string, description?: string) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (name) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }

  if (fields.length === 0) return;

  values.push(orgId, teamId);
  await query(
    `UPDATE teams SET ${fields.join(', ')} WHERE organization_id = $${paramIndex++} AND id = $${paramIndex}`,
    values
  );
}

export async function deleteTeam(orgId: string, teamId: string) {
  await query(`DELETE FROM teams WHERE organization_id = $1 AND id = $2`, [orgId, teamId]);
}

export async function addTeamMember(orgId: string, teamId: string, userId: string, role: string = 'member') {
  await dashboardRepo.createTeamMember(teamId, userId, role);
}

export async function removeTeamMember(orgId: string, teamId: string, userId: string) {
  await query(`DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`, [teamId, userId]);
}

export async function createInvitation(orgId: string, email: string, role: string = 'member') {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM organization_invitations WHERE organization_id = $1 AND email = $2 AND accepted_at IS NULL AND expires_at > NOW()`,
    [orgId, email]
  );
  if (existing) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return queryOne<{ id: string; email: string; token: string; expires_at: string }>(
    `INSERT INTO organization_invitations (organization_id, email, role, token, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, token, expires_at`,
    [orgId, email, role, token, expiresAt]
  );
}

export async function listInvitations(orgId: string) {
  return query<{ id: string; email: string; role: string; token: string; expires_at: string; accepted_at: string | null; created_at: string }>(
    `SELECT id, email, role, token, expires_at, accepted_at, created_at FROM organization_invitations WHERE organization_id = $1 ORDER BY created_at DESC`,
    [orgId]
  );
}

export async function acceptInvitation(token: string) {
  const invitation = await queryOne<{ id: string; organization_id: string; email: string; role: string; expires_at: string }>(
    `SELECT id, organization_id, email, role, expires_at FROM organization_invitations WHERE token = $1 AND accepted_at IS NULL`,
    [token]
  );

  if (!invitation) return null;
  if (new Date(invitation.expires_at) < new Date()) return null;

  const passwordHash = await argon2.hash('temporary-password-' + crypto.randomBytes(8).toString('hex'));
  const user = await dashboardRepo.createUser(invitation.email, passwordHash, null, invitation.organization_id, invitation.role);

  const defaultTeam = await queryOne<{ id: string }>(
    `SELECT id FROM teams WHERE organization_id = $1 AND name = 'General'`,
    [invitation.organization_id]
  );
  if (defaultTeam) {
    await dashboardRepo.createTeamMember(defaultTeam.id, user.id, 'member');
  }

  await query(`UPDATE organization_invitations SET accepted_at = NOW() WHERE id = $1`, [invitation.id]);

  const jwtToken = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: user.organization_id,
    role: user.role,
  });

  return {
    token: jwtToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organization_id,
      role: user.role,
    },
  };
}

export async function revokeInvitation(orgId: string, invitationId: string) {
  await query(`DELETE FROM organization_invitations WHERE organization_id = $1 AND id = $2`, [orgId, invitationId]);
}

export async function resendInvitation(orgId: string, invitationId: string) {
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  return queryOne<{ id: string; email: string; token: string; expires_at: string }>(
    `UPDATE organization_invitations SET expires_at = $1 WHERE organization_id = $2 AND id = $3 AND accepted_at IS NULL RETURNING id, email, token, expires_at`,
    [newExpiresAt, orgId, invitationId]
  );
}

export async function generateEnrollmentKey(orgId: string, name: string, expiresAt?: string) {
  const prefix = `ai_live_${crypto.randomBytes(4).toString('hex')}`;
  const fullKey = `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
  const keyHash = await argon2.hash(fullKey);

  const expiry = expiresAt ? new Date(expiresAt) : null;

  const key = await queryOne<{ id: string; name: string; prefix: string; created_at: string }>(
    `INSERT INTO organization_enrollment_keys (organization_id, name, key_hash, prefix, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, prefix, created_at`,
    [orgId, name, keyHash, prefix, expiry]
  );

  return { ...key, key: fullKey };
}

export async function listEnrollmentKeys(orgId: string) {
  return query<{ id: string; name: string; prefix: string; expires_at: string | null; created_at: string; last_used_at: string | null }>(
    `SELECT id, name, prefix, expires_at, created_at, last_used_at FROM organization_enrollment_keys WHERE organization_id = $1 ORDER BY created_at DESC`,
    [orgId]
  );
}

export async function revokeEnrollmentKey(orgId: string, keyId: string) {
  await query(`DELETE FROM organization_enrollment_keys WHERE organization_id = $1 AND id = $2`, [orgId, keyId]);
}

export async function rotateEnrollmentKey(orgId: string, keyId: string) {
  const oldKey = await queryOne<{ id: string; name: string; expires_at: string | null }>(
    `SELECT id, name, expires_at FROM organization_enrollment_keys WHERE organization_id = $1 AND id = $2`,
    [orgId, keyId]
  );
  if (!oldKey) return null;

  await query(`DELETE FROM organization_enrollment_keys WHERE organization_id = $1 AND id = $2`, [orgId, keyId]);

  return generateEnrollmentKey(orgId, oldKey.name, oldKey.expires_at ?? undefined);
}

export async function registerAgent(enrollmentKey: string, hostname: string, os?: string, architecture?: string, agentVersion?: string) {
  const prefix = enrollmentKey.slice(0, 20);
  const keyRecord = await queryOne<{ id: string; organization_id: string; key_hash: string; expires_at: string | null }>(
    `SELECT id, organization_id, key_hash, expires_at FROM organization_enrollment_keys WHERE prefix = $1`,
    [prefix]
  );

  if (!keyRecord) return null;

  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) return null;

  const isValid = await argon2.verify(keyRecord.key_hash, enrollmentKey);
  if (!isValid) return null;

  await query(`UPDATE organization_enrollment_keys SET last_used_at = NOW() WHERE id = $1`, [keyRecord.id]);

  const user = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE organization_id = $1 LIMIT 1`,
    [keyRecord.organization_id]
  );
  if (!user) return null;

  const machine = await queryOne<{ id: string }>(
    `INSERT INTO machines (organization_id, user_id, hostname, os, architecture, agent_version, status, enrollment_key_id)
     VALUES ($1, $2, $3, $4, $5, $6, 'ONLINE', $7)
     ON CONFLICT (organization_id, hostname) DO UPDATE SET
       os = EXCLUDED.os, architecture = EXCLUDED.architecture, agent_version = EXCLUDED.agent_version,
       status = 'ONLINE', last_seen = NOW(), enrollment_key_id = EXCLUDED.enrollment_key_id
     RETURNING id`,
    [keyRecord.organization_id, user.id, hostname, os, architecture, agentVersion, keyRecord.id]
  );

  const agentToken = signToken({
    id: user.id,
    email: '',
    name: null,
    organizationId: keyRecord.organization_id,
    role: 'agent',
  });

  return {
    organizationId: keyRecord.organization_id,
    machineId: machine!.id,
    syncInterval: 300,
    agentToken,
  };
}

export async function agentHeartbeat(agentToken: string, machineId: string) {
  try {
    const { verifyToken } = await import('../middlewares/auth.middleware.js');
    const payload = verifyToken(agentToken);

    await query(
      `UPDATE machines SET last_seen = NOW(), status = 'ONLINE' WHERE id = $1 AND organization_id = $2`,
      [machineId, payload.orgId]
    );

    return { status: 'ok' };
  } catch {
    return null;
  }
}

export async function listAgents(orgId: string) {
  return query<{ id: string; hostname: string; os: string | null; architecture: string | null; agent_version: string | null; first_seen: string; last_seen: string; status: string }>(
    `SELECT id, hostname, os, architecture, agent_version, first_seen, last_seen, status FROM machines WHERE organization_id = $1 ORDER BY last_seen DESC`,
    [orgId]
  );
}

export async function getAgent(orgId: string, machineId: string) {
  return queryOne<{ id: string; hostname: string; os: string | null; architecture: string | null; agent_version: string | null; first_seen: string; last_seen: string; status: string }>(
    `SELECT id, hostname, os, architecture, agent_version, first_seen, last_seen, status FROM machines WHERE organization_id = $1 AND id = $2`,
    [orgId, machineId]
  );
}