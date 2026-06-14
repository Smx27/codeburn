import { Pool } from 'pg';
import argon2 from 'argon2';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://aiinsight:aiinsight_secret@localhost:5432/aiinsight',
});

async function seed() {
  console.log('🌱 Seeding AiInsight test organization...\n');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orgResult = await client.query(
      `INSERT INTO organizations (name) VALUES ($1) RETURNING id, name`,
      ['AiInsight Test Org']
    );
    const org = orgResult.rows[0];
    console.log(`✅ Organization: ${org.name} (${org.id})`);

    await client.query(
      `INSERT INTO organization_settings (organization_id) VALUES ($1)`,
      [org.id]
    );

    const passwordHash = await argon2.hash('password123');

    const users = [
      { email: 'owner@aiinsight.local', name: 'Owner', role: 'owner' },
      { email: 'admin@aiinsight.local', name: 'Admin', role: 'admin' },
      { email: 'member1@aiinsight.local', name: 'Member 1', role: 'member' },
      { email: 'member2@aiinsight.local', name: 'Member 2', role: 'member' },
      { email: 'member3@aiinsight.local', name: 'Member 3', role: 'member' },
    ];

    const createdUsers = [];
    for (const user of users) {
      const result = await client.query(
        `INSERT INTO users (email, password_hash, name, organization_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role`,
        [user.email, passwordHash, user.name, org.id, user.role]
      );
      createdUsers.push(result.rows[0]);
      console.log(`✅ User: ${user.email} (${user.role})`);
    }

    const teams = [
      { name: 'Platform Team', description: 'Platform engineering team' },
      { name: 'AI Team', description: 'AI/ML team' },
      { name: 'Security Team', description: 'Security team' },
    ];

    const createdTeams = [];
    for (const team of teams) {
      const result = await client.query(
        `INSERT INTO teams (organization_id, name, description) VALUES ($1, $2, $3) RETURNING id, name`,
        [org.id, team.name, team.description]
      );
      createdTeams.push(result.rows[0]);
      console.log(`✅ Team: ${team.name}`);
    }

    await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [createdTeams[0].id, createdUsers[0].id]
    );
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [createdTeams[1].id, createdUsers[1].id]
    );
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [createdTeams[2].id, createdUsers[0].id]
    );

    for (let i = 2; i < createdUsers.length; i++) {
      const teamIndex = i % createdTeams.length;
      await client.query(
        `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')`,
        [createdTeams[teamIndex].id, createdUsers[i].id]
      );
    }
    console.log('✅ Team members assigned');

    const enrollmentKeys = [];
    for (let i = 0; i < 3; i++) {
      const prefix = `ai_test_${crypto.randomBytes(4).toString('hex')}`;
      const fullKey = `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
      const keyHash = await argon2.hash(fullKey);

      const result = await client.query(
        `INSERT INTO organization_enrollment_keys (organization_id, name, key_hash, prefix) VALUES ($1, $2, $3, $4) RETURNING id, name, prefix`,
        [org.id, `Test Key ${i + 1}`, keyHash, prefix]
      );
      enrollmentKeys.push({ ...result.rows[0], key: fullKey });
      console.log(`✅ Enrollment Key: ${result.rows[0].name} (${fullKey})`);
    }

    const machines = [
      { hostname: 'dev-macbook-pro', os: 'darwin', architecture: 'arm64' },
      { hostname: 'dev-macbook-air', os: 'darwin', architecture: 'arm64' },
      { hostname: 'dev-windows-pc', os: 'win32', architecture: 'x64' },
      { hostname: 'dev-linux-workstation', os: 'linux', architecture: 'x64' },
      { hostname: 'dev-linux-server', os: 'linux', architecture: 'x64' },
      { hostname: 'ci-runner-1', os: 'linux', architecture: 'x64' },
      { hostname: 'ci-runner-2', os: 'linux', architecture: 'x64' },
      { hostname: 'staging-macbook', os: 'darwin', architecture: 'arm64' },
      { hostname: 'staging-windows', os: 'win32', architecture: 'x64' },
      { hostname: 'prod-linux', os: 'linux', architecture: 'x64' },
    ];

    const createdMachines = [];
    for (let i = 0; i < machines.length; i++) {
      const machine = machines[i];
      const userId = createdUsers[i % createdUsers.length].id;
      const keyId = enrollmentKeys[i % enrollmentKeys.length].id;
      const status = i < 7 ? 'ONLINE' : 'OFFLINE';
      const agentVersion = '0.9.12';

      const result = await client.query(
        `INSERT INTO machines (organization_id, user_id, hostname, os, architecture, agent_version, status, enrollment_key_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, hostname, status`,
        [org.id, userId, machine.hostname, machine.os, machine.architecture, agentVersion, status, keyId]
      );
      createdMachines.push(result.rows[0]);
      console.log(`✅ Machine: ${machine.hostname} (${status})`);
    }

    const providers = ['claude', 'codex', 'cursor', 'gemini', 'opencode'];
    const sessions = [];
    const ownerUserId = createdUsers[0].id;
    for (let i = 0; i < 20; i++) {
      const machine = createdMachines[i % createdMachines.length];
      const provider = providers[i % providers.length];
      const sessionId = crypto.randomUUID();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));

      const result = await client.query(
        `INSERT INTO sessions (id, organization_id, user_id, machine_id, provider_id, external_session_id, started_at, raw_metadata)
         VALUES ($1, $2, $3, $4, (SELECT id FROM providers WHERE name = $5), $6, $7, $8) RETURNING id`,
        [sessionId, org.id, ownerUserId, machine.id, provider, `session-${i}`, startDate, JSON.stringify({ project: `project-${i % 5}` })]
      );
      sessions.push(result.rows[0]);
    }
    console.log(`✅ ${sessions.length} sessions created`);

    for (const session of sessions) {
      const eventCount = Math.floor(Math.random() * 10) + 5;
      for (let i = 0; i < eventCount; i++) {
        const inputTokens = Math.floor(Math.random() * 10000) + 1000;
        const outputTokens = Math.floor(Math.random() * 5000) + 500;
        const cost = (inputTokens * 0.000003 + outputTokens * 0.000015);

        await client.query(
          `INSERT INTO events (organization_id, session_id, event_type, model, input_tokens, output_tokens, estimated_cost, event_time, payload)
           VALUES ($1, $2, 'api_call', $3, $4, $5, $6, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days', $7)`,
          [org.id, session.id, ['claude-3-opus', 'claude-3-sonnet', 'gpt-4', 'gpt-3.5-turbo'][i % 4], inputTokens, outputTokens, cost, JSON.stringify({ source: 'seed' })]
        );
      }
    }
    console.log('✅ Events created');

    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      await client.query(
        `INSERT INTO daily_usage (organization_id, usage_date, total_sessions, total_users, total_tokens, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (organization_id, usage_date) DO UPDATE SET
           total_sessions = EXCLUDED.total_sessions, total_users = EXCLUDED.total_users,
           total_tokens = EXCLUDED.total_tokens, total_cost = EXCLUDED.total_cost`,
        [org.id, dateStr, Math.floor(Math.random() * 50) + 10, Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 100000) + 10000, Math.random() * 50 + 10]
      );
    }
    console.log('✅ Daily usage aggregates created');

    for (const provider of providers) {
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        await client.query(
          `INSERT INTO daily_provider_usage (organization_id, provider_id, usage_date, total_sessions, total_tokens, total_cost)
           VALUES ($1, (SELECT id FROM providers WHERE name = $2), $3, $4, $5, $6)
           ON CONFLICT (organization_id, provider_id, usage_date) DO UPDATE SET
             total_sessions = EXCLUDED.total_sessions, total_tokens = EXCLUDED.total_tokens, total_cost = EXCLUDED.total_cost`,
          [org.id, provider, dateStr, Math.floor(Math.random() * 20) + 5, Math.floor(Math.random() * 50000) + 5000, Math.random() * 20 + 5]
        );
      }
    }
    console.log('✅ Daily provider usage created');

    await client.query('COMMIT');

    console.log('\n=================================');
    console.log('Test Organization Ready');
    console.log('=================================');
    console.log(`Organization: ${org.name}`);
    console.log(`Owner: owner@aiinsight.local`);
    console.log(`Password: password123`);
    console.log(`\nEnrollment Keys:`);
    for (const key of enrollmentKeys) {
      console.log(`  ${key.name}: ${key.key}`);
    }
    console.log('=================================\n');

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
