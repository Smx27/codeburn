import * as dashboardRepo from '../repositories/dashboard.repository.js';
import { signToken } from '../middlewares/auth.middleware.js';
import { query, queryOne } from '../database/pool.js';
import { getMailProvider } from './mail/index.js';
import * as templates from './mail/templates/index.js';
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

  try {
    await generateEmailVerification(user.id);
  } catch {
    // Don't fail registration if email sending fails
  }

  try {
    const mail = await getMailProvider();
    const baseUrl = process.env.APP_URL || process.env.DASHBOARD_URL || 'http://localhost:3000';
    await mail.send({
      to: email,
      ...templates.welcome({
        userName: name || email,
        organizationName,
        dashboardUrl: `${baseUrl}/dashboard`,
      }),
    });
  } catch {
    // Don't fail registration if welcome email fails
  }

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

export async function createInvitation(orgId: string, email: string, role: string = 'member', inviterName?: string) {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM organization_invitations WHERE organization_id = $1 AND email = $2 AND accepted_at IS NULL AND expires_at > NOW()`,
    [orgId, email]
  );
  if (existing) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await queryOne<{ id: string; email: string; token: string; expires_at: string }>(
    `INSERT INTO organization_invitations (organization_id, email, role, token, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, token, expires_at`,
    [orgId, email, role, token, expiresAt]
  );

  if (invitation) {
    try {
      const org = await dashboardRepo.getOrganizationById(orgId);
      if (org) {
        const mail = await getMailProvider();
        const baseUrl = process.env.APP_URL || process.env.DASHBOARD_URL || 'http://localhost:3000';
        await mail.send({
          to: email,
          ...templates.invite({
            inviterName: inviterName || 'Your team',
            organizationName: org.name,
            role,
            invitationUrl: `${baseUrl}/accept-invitation?token=${token}`,
            expiresIn: '7 days',
          }),
        });
      }
    } catch {
      // Don't fail invitation creation if email fails
    }
  }

  return invitation;
}

export async function listInvitations(orgId: string) {
  return query<{ id: string; email: string; role: string; expires_at: string; accepted_at: string | null; created_at: string }>(
    `SELECT id, email, role, expires_at, accepted_at, created_at FROM organization_invitations WHERE organization_id = $1 ORDER BY created_at DESC`,
    [orgId]
  );
}

export async function acceptInvitation(token: string, password?: string, name?: string) {
  const invitation = await queryOne<{ id: string; organization_id: string; email: string; role: string; expires_at: string }>(
    `SELECT id, organization_id, email, role, expires_at FROM organization_invitations WHERE token = $1 AND accepted_at IS NULL`,
    [token]
  );

  if (!invitation) return null;
  if (new Date(invitation.expires_at) < new Date()) return null;

  // Use provided password or generate a temporary one (backward compatible)
  const passwordHash = password
    ? await argon2.hash(password)
    : await argon2.hash('temporary-password-' + crypto.randomBytes(8).toString('hex'));

  const user = await dashboardRepo.createUser(invitation.email, passwordHash, name || null, invitation.organization_id, invitation.role);

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

  const invitation = await queryOne<{ id: string; email: string; token: string; role: string; expires_at: string }>(
    `UPDATE organization_invitations SET expires_at = $1 WHERE organization_id = $2 AND id = $3 AND accepted_at IS NULL RETURNING id, email, token, role, expires_at`,
    [newExpiresAt, orgId, invitationId]
  );

  if (invitation) {
    try {
      const org = await dashboardRepo.getOrganizationById(orgId);
      if (org) {
        const mail = await getMailProvider();
        const baseUrl = process.env.APP_URL || process.env.DASHBOARD_URL || 'http://localhost:3000';
        await mail.send({
          to: invitation.email,
          ...templates.invite({
            inviterName: 'Your team',
            organizationName: org.name,
            role: invitation.role,
            invitationUrl: `${baseUrl}/accept-invitation?token=${invitation.token}`,
            expiresIn: '7 days',
          }),
        });
      }
    } catch {
      // Don't fail resend if email fails
    }
  }

  return invitation;
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

  try {
    const org = await dashboardRepo.getOrganizationById(keyRecord.organization_id);
    if (org) {
      const adminUser = await queryOne<{ email: string }>(
        `SELECT email FROM users WHERE organization_id = $1 AND role = 'owner' LIMIT 1`,
        [keyRecord.organization_id]
      );
      if (adminUser) {
        const mail = await getMailProvider();
        await mail.send({
          to: adminUser.email,
          ...templates.agentConnected({
            machineName: hostname,
            os: os || null,
            organizationName: org.name,
            timestamp: new Date().toISOString(),
          }),
        });
      }
    }
  } catch {
    // Don't fail agent registration if email fails
  }

  const agentToken = signToken({
    id: user.id,
    email: '',
    name: null,
    organizationId: keyRecord.organization_id,
    role: 'agent',
    machineId: machine!.id,
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

// --- Agent Config & Enhanced Registration ---

export async function getAgentConfig(machineId: string): Promise<{
  apiUrl: string;
  organizationId: string;
  machineId: string;
  syncInterval: number;
  environment: string;
} | null> {
  const machine = await dashboardRepo.getMachineWithOrg(machineId);
  if (!machine) return null;

  return {
    apiUrl: process.env.API_URL || 'http://localhost:3002',
    organizationId: machine.organization_id,
    machineId: machine.id,
    syncInterval: 300,
    environment: process.env.NODE_ENV || 'development',
  };
}

export async function generateAgentToken(machineId: string): Promise<string> {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  await dashboardRepo.createAgentToken(machineId, tokenHash, expiresAt);
  return rawToken;
}

export async function validateAgentToken(token: string): Promise<{ machineId: string; organizationId: string } | null> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await dashboardRepo.getAgentTokenByHash(tokenHash);

  if (!record) return null;

  if (record.expires_at && new Date(record.expires_at) < new Date()) return null;

  await dashboardRepo.updateAgentTokenLastUsed(record.id);

  const machine = await dashboardRepo.getMachineWithOrg(record.machine_id);
  if (!machine) return null;

  return {
    machineId: machine.id,
    organizationId: machine.organization_id,
  };
}

export async function registerAgentEnhanced(
  enrollmentKey: string,
  hostname: string,
  os: string,
  architecture: string,
  agentVersion?: string
): Promise<{
  machineId: string;
  organizationId: string;
  agentToken: string;
  syncInterval: number;
} | null> {
  const result = await registerAgent(enrollmentKey, hostname, os, architecture, agentVersion);
  if (!result) return null;

  const agentToken = await generateAgentToken(result.machineId);

  return {
    machineId: result.machineId,
    organizationId: result.organizationId,
    agentToken,
    syncInterval: result.syncInterval,
  };
}

// --- Agent Login (API Key based) ---

export async function agentLogin(
  apiKey: string,
  hostname: string,
  os: string,
  architecture: string,
  agentVersion?: string
): Promise<{
  organizationId: string;
  organizationName: string;
  machineId: string;
  apiUrl: string;
  syncInterval: number;
  agentToken: string;
} | null> {
  // Validate API key - supports both cb_ and aisk_ prefixes
  const prefix = apiKey.slice(0, 8);
  const keyRecord = await queryOne<{ id: string; organization_id: string; key_hash: string; role: string }>(
    `SELECT id, organization_id, key_hash, role FROM api_keys WHERE prefix = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
    [prefix]
  );

  if (!keyRecord) return null;

  const isValid = await argon2.verify(keyRecord.key_hash, apiKey);
  if (!isValid) return null;

  // Update last_used_at
  await query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [keyRecord.id]);

  // Get organization name
  const org = await dashboardRepo.getOrganizationById(keyRecord.organization_id);
  if (!org) return null;

  // Upsert machine
  const machine = await queryOne<{ id: string }>(
    `INSERT INTO machines (organization_id, hostname, os, architecture, agent_version, status)
     VALUES ($1, $2, $3, $4, $5, 'ONLINE')
     ON CONFLICT (organization_id, hostname) DO UPDATE SET
       os = EXCLUDED.os,
       architecture = EXCLUDED.architecture,
       agent_version = EXCLUDED.agent_version,
       last_seen = NOW(),
       status = 'ONLINE'
     RETURNING id`,
    [keyRecord.organization_id, hostname, os || null, architecture || null, agentVersion || null]
  );

  if (!machine) return null;

  // Generate agent token
  const agentToken = await generateAgentToken(machine.id);

  const apiUrl = process.env.INGESTION_API_URL || process.env.API_URL || 'http://localhost:3001';

  return {
    organizationId: keyRecord.organization_id,
    organizationName: org.name,
    machineId: machine.id,
    apiUrl,
    syncInterval: 300,
    agentToken,
  };
}

// --- Email Verification ---

const APP_BASE_URL = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

export async function generateEmailVerification(userId: string): Promise<void> {
  const user = await dashboardRepo.getUserById(userId);
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await dashboardRepo.createEmailVerification(userId, token, expiresAt);

  const verificationUrl = `${APP_BASE_URL}/verify-email?token=${token}`;
  const template = templates.verifyEmail({
    userName: user.name || user.email,
    verificationUrl,
    expiresIn: '24 hours',
  });

  const mail = await getMailProvider();
  await mail.send({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
  const record = await dashboardRepo.getEmailVerificationByToken(token);
  if (!record) {
    return { success: false, error: 'Invalid or already used verification token' };
  }

  if (new Date(record.expires_at) < new Date()) {
    return { success: false, error: 'Verification token has expired' };
  }

  await dashboardRepo.markEmailVerified(record.user_id);
  await dashboardRepo.deleteEmailVerificationsForUser(record.user_id);

  return { success: true };
}

export async function resendVerification(email: string): Promise<void> {
  const user = await dashboardRepo.getUserByEmail(email);
  if (!user) return;

  await dashboardRepo.deleteEmailVerificationsForUser(user.id);
  await generateEmailVerification(user.id);
}

// --- Password Reset ---

export async function generatePasswordReset(email: string): Promise<void> {
  const user = await dashboardRepo.getUserByEmail(email);
  if (!user) return;

  await dashboardRepo.deletePasswordResetsForUser(user.id);

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await dashboardRepo.createPasswordReset(user.id, tokenHash, expiresAt);

  const resetUrl = `${APP_BASE_URL}/reset-password?token=${token}`;
  const template = templates.passwordReset({
    userName: user.name || user.email,
    resetUrl,
    expiresIn: '1 hour',
  });

  const mail = await getMailProvider();
  await mail.send({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await dashboardRepo.getPasswordResetByTokenHash(tokenHash);

  if (!record) {
    return { success: false, error: 'Invalid or already used reset token' };
  }

  if (new Date(record.expires_at) < new Date()) {
    return { success: false, error: 'Reset token has expired' };
  }

  const passwordHash = await argon2.hash(newPassword);
  await dashboardRepo.updateUserPassword(record.user_id, passwordHash);
  await dashboardRepo.markPasswordResetUsed(record.id);
  await dashboardRepo.deleteRefreshTokensForUser(record.user_id);

  return { success: true };
}

// --- API Key Management ---

export async function listApiKeys(orgId: string) {
  return dashboardRepo.listApiKeys(orgId);
}

export async function createApiKey(orgId: string, name: string, role: string = 'write', expiresAt?: string) {
  const prefix = `aisk_${crypto.randomBytes(4).toString('hex')}`;
  const fullKey = `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
  const keyHash = await argon2.hash(fullKey);

  const expiry = expiresAt ? new Date(expiresAt) : null;

  const key = await dashboardRepo.createApiKey(orgId, name, keyHash, prefix, role, expiry);

  return { ...key, key: fullKey };
}

export async function deleteApiKey(orgId: string, keyId: string) {
  await dashboardRepo.deleteApiKey(orgId, keyId);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  const user = await dashboardRepo.getUserWithPasswordByEmail(
    (await dashboardRepo.getUserById(userId))?.email ?? ''
  );
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const passwordValid = await argon2.verify(user.password_hash, currentPassword);
  if (!passwordValid) {
    return { success: false, error: 'Current password is incorrect' };
  }

  const passwordHash = await argon2.hash(newPassword);
  await dashboardRepo.updateUserPassword(userId, passwordHash);
  await dashboardRepo.deleteRefreshTokensForUser(userId);

  return { success: true };
}

// --- Sync Completed Email ---

export async function sendSyncCompletedEmail(
  orgId: string,
  sessionsImported: number,
  providersDetected: string[]
): Promise<void> {
  try {
    const org = await dashboardRepo.getOrganizationById(orgId);
    if (!org) return;

    // Get the org owner to send the email to
    const owner = await queryOne<{ email: string; name: string | null }>(
      `SELECT email, name FROM users WHERE organization_id = $1 AND role = 'owner' LIMIT 1`,
      [orgId]
    );
    if (!owner) return;

    const mail = await getMailProvider();
    const baseUrl = process.env.APP_URL || process.env.DASHBOARD_URL || 'http://localhost:3000';
    await mail.send({
      to: owner.email,
      ...templates.syncCompleted({
        userName: owner.name || owner.email,
        sessionsImported,
        providersDetected,
        dashboardUrl: `${baseUrl}/dashboard`,
      }),
    });
  } catch {
    // Don't fail if email sending fails
  }
}