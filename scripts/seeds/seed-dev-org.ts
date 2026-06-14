import { Pool } from 'pg';
import argon2 from 'argon2';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://aiinsight:aiinsight_secret@localhost:5432/aiinsight',
});

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(monthsBack: number): Date {
  const now = Date.now();
  const msBack = monthsBack * 30 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * msBack);
}

function randomFutureDate(maxDays: number): Date {
  return new Date(Date.now() + randomInt(1, maxDays) * 24 * 60 * 60 * 1000);
}

function pastDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d;
}

async function seed() {
  console.log('🌱 Seeding AiInsight comprehensive test data...\n');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🔄 Truncating existing data...');
    await client.query('TRUNCATE TABLE email_verifications, password_resets, agent_tokens, sync_jobs, organization_enrollment_keys, organization_invitations, team_members, teams, organization_settings, daily_provider_usage, daily_user_usage, daily_project_usage, daily_model_usage, daily_usage, events, sessions, api_keys, refresh_tokens, users, machines CASCADE');
    console.log('✅ Cleared existing data\n');

    const passwordHash = await argon2.hash('password123');

    // ── Organizations ──────────────────────────────────────────────
    console.log('── Creating Organizations ──');
    const orgDefs = [
      { name: 'AiInsight Test Org', state: 'fully_onboarded' },
      { name: 'Acme Corporation', state: 'partially_onboarded' },
      { name: 'Startup Labs', state: 'just_created' },
      { name: 'Enterprise Inc', state: 'fully_onboarded' },
    ];

    const orgs: { id: string; name: string; state: string }[] = [];
    for (const def of orgDefs) {
      const r = await client.query(
        `INSERT INTO organizations (name) VALUES ($1) RETURNING id, name`,
        [def.name]
      );
      orgs.push({ ...r.rows[0], state: def.state });
      await client.query(
        `INSERT INTO organization_settings (organization_id) VALUES ($1)`,
        [r.rows[0].id]
      );
      console.log(`  ✅ ${def.name}`);
    }

    // ── Users ──────────────────────────────────────────────────────
    console.log('\n── Creating Users ──');
    type UserDef = { email: string; name: string; role: string; verified: boolean };
    const userDefsByOrg: Record<string, UserDef[]> = {
      'AiInsight Test Org': [
        { email: 'owner@aiinsight.local', name: 'Owner', role: 'owner', verified: true },
        { email: 'admin1@aiinsight.local', name: 'Admin One', role: 'admin', verified: true },
        { email: 'admin2@aiinsight.local', name: 'Admin Two', role: 'admin', verified: true },
        { email: 'member1@aiinsight.local', name: 'Member One', role: 'member', verified: true },
        { email: 'member2@aiinsight.local', name: 'Member Two', role: 'member', verified: true },
        { email: 'member3@aiinsight.local', name: 'Member Three', role: 'member', verified: true },
        { email: 'member4@aiinsight.local', name: 'Member Four', role: 'member', verified: false },
        { email: 'member5@aiinsight.local', name: 'Member Five', role: 'member', verified: true },
        { email: 'member6@aiinsight.local', name: 'Member Six', role: 'member', verified: false },
        { email: 'member7@aiinsight.local', name: 'Member Seven', role: 'member', verified: true },
      ],
      'Acme Corporation': [
        { email: 'admin@acme.local', name: 'Acme Admin', role: 'owner', verified: true },
        { email: 'dev1@acme.local', name: 'Acme Dev 1', role: 'member', verified: true },
        { email: 'dev2@acme.local', name: 'Acme Dev 2', role: 'member', verified: true },
        { email: 'dev3@acme.local', name: 'Acme Dev 3', role: 'member', verified: false },
        { email: 'pm@acme.local', name: 'Acme PM', role: 'admin', verified: true },
      ],
      'Startup Labs': [
        { email: 'founder@startuplabs.local', name: 'Founder', role: 'owner', verified: true },
        { email: 'cto@startuplabs.local', name: 'CTO', role: 'admin', verified: false },
      ],
      'Enterprise Inc': [
        { email: 'admin@enterprise.local', name: 'Ent Admin', role: 'owner', verified: true },
        { email: 'lead1@enterprise.local', name: 'Lead 1', role: 'admin', verified: true },
        { email: 'lead2@enterprise.local', name: 'Lead 2', role: 'admin', verified: true },
        { email: 'eng1@enterprise.local', name: 'Eng 1', role: 'member', verified: true },
        { email: 'eng2@enterprise.local', name: 'Eng 2', role: 'member', verified: true },
        { email: 'eng3@enterprise.local', name: 'Eng 3', role: 'member', verified: false },
        { email: 'eng4@enterprise.local', name: 'Eng 4', role: 'member', verified: true },
        { email: 'eng5@enterprise.local', name: 'Eng 5', role: 'member', verified: true },
      ],
    };

    const usersByOrg: Record<string, { id: string; email: string; role: string }[]> = {};
    for (const org of orgs) {
      const defs = userDefsByOrg[org.name] || [];
      usersByOrg[org.name] = [];
      for (const u of defs) {
        const lastLogin = u.verified ? randomDate(3) : null;
        const r = await client.query(
          `INSERT INTO users (email, password_hash, name, organization_id, role, email_verified, last_login_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, role`,
          [u.email, passwordHash, u.name, org.id, u.role, u.verified, lastLogin]
        );
        usersByOrg[org.name].push(r.rows[0]);
        console.log(`  ✅ ${u.email} (${u.role}, verified=${u.verified})`);
      }
    }

    // ── Teams ──────────────────────────────────────────────────────
    console.log('\n── Creating Teams ──');
    const teamDefsByOrg: Record<string, { name: string; desc: string }[]> = {
      'AiInsight Test Org': [
        { name: 'Platform', desc: 'Platform engineering' },
        { name: 'AI/ML', desc: 'AI and machine learning' },
        { name: 'Security', desc: 'Security and compliance' },
        { name: 'Engineering', desc: 'General engineering' },
        { name: 'Data', desc: 'Data engineering' },
      ],
      'Acme Corporation': [
        { name: 'Engineering', desc: 'Software engineering' },
        { name: 'Data Science', desc: 'Data science and analytics' },
      ],
      'Enterprise Inc': [
        { name: 'Platform', desc: 'Platform team' },
        { name: 'Backend', desc: 'Backend services' },
        { name: 'Frontend', desc: 'Frontend applications' },
        { name: 'DevOps', desc: 'DevOps and SRE' },
        { name: 'QA', desc: 'Quality assurance' },
      ],
    };

    const teamsByOrg: Record<string, { id: string; name: string }[]> = {};
    for (const org of orgs) {
      const defs = teamDefsByOrg[org.name] || [];
      teamsByOrg[org.name] = [];
      for (const t of defs) {
        const r = await client.query(
          `INSERT INTO teams (organization_id, name, description) VALUES ($1, $2, $3) RETURNING id, name`,
          [org.id, t.name, t.desc]
        );
        teamsByOrg[org.name].push(r.rows[0]);
      }
      console.log(`  ✅ ${org.name}: ${defs.map((d) => d.name).join(', ') || '(none)'}`);
    }

    // Assign team members
    for (const org of orgs) {
      const users = usersByOrg[org.name];
      const teams = teamsByOrg[org.name];
      if (!users.length || !teams.length) continue;
      // First user is team admin for first team
      await client.query(
        `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'admin')`,
        [teams[0].id, users[0].id]
      );
      // Distribute remaining users
      for (let i = 1; i < users.length; i++) {
        const teamIdx = i % teams.length;
        await client.query(
          `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')`,
          [teams[teamIdx].id, users[i].id]
        );
      }
    }
    console.log('  ✅ Team members assigned');

    // ── Enrollment Keys ────────────────────────────────────────────
    console.log('\n── Creating Enrollment Keys ──');
    type KeyDef = { name: string; expired: boolean };
    const keyDefsByOrg: Record<string, KeyDef[]> = {
      'AiInsight Test Org': [
        { name: 'Active Key 1', expired: false },
        { name: 'Active Key 2', expired: false },
        { name: 'Active Key 3', expired: false },
        { name: 'Expired Key', expired: true },
      ],
      'Acme Corporation': [
        { name: 'Acme Key 1', expired: false },
        { name: 'Acme Key 2', expired: false },
      ],
      'Enterprise Inc': [
        { name: 'Ent Key 1', expired: false },
        { name: 'Ent Key 2', expired: false },
        { name: 'Ent Key 3', expired: false },
        { name: 'Ent Key 4', expired: false },
        { name: 'Ent Expired 1', expired: true },
        { name: 'Ent Expired 2', expired: true },
      ],
    };

    const keysByOrg: Record<string, { id: string; name: string; key: string }[]> = {};
    for (const org of orgs) {
      const defs = keyDefsByOrg[org.name] || [];
      keysByOrg[org.name] = [];
      for (const kd of defs) {
        const prefix = `ai_${org.name.split(' ')[0].toLowerCase()}_${crypto.randomBytes(3).toString('hex')}`;
        const fullKey = `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
        const keyHash = await argon2.hash(fullKey);
        const expiresAt = kd.expired ? pastDate(30) : randomFutureDate(90);
        const r = await client.query(
          `INSERT INTO organization_enrollment_keys (organization_id, name, key_hash, prefix, expires_at)
           VALUES ($1, $2, $3, $4, $5) RETURNING id, name, prefix`,
          [org.id, kd.name, keyHash, prefix, expiresAt]
        );
        keysByOrg[org.name].push({ ...r.rows[0], key: fullKey });
        console.log(`  ✅ ${kd.name} (${prefix}...) expired=${kd.expired}`);
      }
    }

    // ── Machines (25 total) ────────────────────────────────────────
    console.log('\n── Creating Machines ──');
    type MachineDef = {
      hostname: string;
      os: string;
      arch: string;
      version: string;
      status: string;
      daysSinceLastSeen: number;
    };

    const machineDefsByOrg: Record<string, MachineDef[]> = {
      'AiInsight Test Org': [
        { hostname: 'laptop-mba-priya', os: 'darwin', arch: 'arm64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'laptop-mbp-alex', os: 'darwin', arch: 'arm64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'dev-ubuntu-sam', os: 'linux', arch: 'x64', version: '0.9.11', status: 'ONLINE', daysSinceLastSeen: 1 },
        { hostname: 'dev-fedora-jordan', os: 'linux', arch: 'x64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'dev-windows-taylor', os: 'win32', arch: 'x64', version: '0.9.10', status: 'ONLINE', daysSinceLastSeen: 2 },
        { hostname: 'ci-runner-1', os: 'linux', arch: 'x64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'ci-runner-2', os: 'linux', arch: 'x64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'staging-mac', os: 'darwin', arch: 'arm64', version: '0.9.9', status: 'OFFLINE', daysSinceLastSeen: 14 },
        { hostname: 'dev-debian-old', os: 'linux', arch: 'x64', version: '0.8.5', status: 'OFFLINE', daysSinceLastSeen: 45 },
        { hostname: 'laptop-surface', os: 'win32', arch: 'x64', version: '0.9.1', status: 'UNKNOWN', daysSinceLastSeen: 90 },
      ],
      'Acme Corporation': [
        { hostname: 'acme-laptop-1', os: 'darwin', arch: 'arm64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'acme-laptop-2', os: 'darwin', arch: 'arm64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 1 },
        { hostname: 'acme-desktop-1', os: 'win32', arch: 'x64', version: '0.9.11', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'acme-dev-ubuntu', os: 'linux', arch: 'x64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'acme-ci-1', os: 'linux', arch: 'x64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'acme-ci-2', os: 'linux', arch: 'x64', version: '0.9.10', status: 'OFFLINE', daysSinceLastSeen: 7 },
        { hostname: 'acme-staging', os: 'linux', arch: 'x64', version: '0.9.8', status: 'OFFLINE', daysSinceLastSeen: 21 },
        { hostname: 'acme-prod-1', os: 'linux', arch: 'x64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
      ],
      'Enterprise Inc': [
        { hostname: 'ent-laptop-platform', os: 'darwin', arch: 'arm64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'ent-laptop-backend', os: 'darwin', arch: 'arm64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'ent-desktop-frontend', os: 'win32', arch: 'x64', version: '0.9.11', status: 'ONLINE', daysSinceLastSeen: 1 },
        { hostname: 'ent-devops-1', os: 'linux', arch: 'x64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'ent-ci-1', os: 'linux', arch: 'x64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'ent-ci-2', os: 'linux', arch: 'x64', version: '0.9.12', status: 'ONLINE', daysSinceLastSeen: 0 },
        { hostname: 'ent-prod-1', os: 'linux', arch: 'x64', version: '0.9.10', status: 'OFFLINE', daysSinceLastSeen: 30 },
      ],
    };

    const machinesByOrg: Record<string, { id: string; hostname: string }[]> = {};
    for (const org of orgs) {
      const defs = machineDefsByOrg[org.name] || [];
      machinesByOrg[org.name] = [];
      const users = usersByOrg[org.name];
      const keys = keysByOrg[org.name];
      for (let i = 0; i < defs.length; i++) {
        const md = defs[i];
        const userId = users[i % users.length].id;
        const keyId = keys.length > 0 ? keys[i % keys.length].id : null;
        const firstSeen = randomDate(6);
        const lastSeen = new Date(Date.now() - md.daysSinceLastSeen * 24 * 60 * 60 * 1000);
        const r = await client.query(
          `INSERT INTO machines (organization_id, user_id, hostname, os, architecture, agent_version, status, enrollment_key_id, first_seen, last_seen)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, hostname`,
          [org.id, userId, md.hostname, md.os, md.arch, md.version, md.status, keyId, firstSeen, lastSeen]
        );
        machinesByOrg[org.name].push(r.rows[0]);
      }
      console.log(`  ✅ ${org.name}: ${defs.length} machines`);
    }

    // ── Sessions & Events (100K events over 12 months) ─────────────
    console.log('\n── Creating Sessions & Events (target: 100K events) ──');
    const providers = ['claude', 'codex', 'cursor', 'gemini', 'opencode'];
    const models = [
      'claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku',
      'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo',
      'gemini-pro', 'gemini-1.5-flash',
      'cursor-mini', 'opencode-default',
    ];
    const eventTypes = ['api_call', 'api_call', 'api_call', 'tool_use', 'completion'];

    let totalEvents = 0;
    const TARGET_EVENTS = 100_000;

    // Distribute events across orgs proportionally
    const orgEventShare: Record<string, number> = {
      'AiInsight Test Org': 40000,
      'Acme Corporation': 30000,
      'Enterprise Inc': 30000,
    };

    for (const org of orgs) {
      if (org.name === 'Startup Labs') continue; // no machines → no sessions
      const machines = machinesByOrg[org.name];
      const users = usersByOrg[org.name];
      const targetEvents = orgEventShare[org.name] || 10000;

      // ~150 events per session → need ~targetEvents/150 sessions
      const sessionCount = Math.ceil(targetEvents / 150);
      let orgEvents = 0;

      console.log(`  📦 ${org.name}: generating ~${targetEvents} events in ${sessionCount} sessions...`);

      for (let s = 0; s < sessionCount && orgEvents < targetEvents; s++) {
        const machine = machines[s % machines.length];
        const user = users[s % users.length];
        const provider = providers[s % providers.length];
        const sessionId = crypto.randomUUID();
        const startDate = randomDate(12);
        const endDate = new Date(startDate.getTime() + randomInt(5, 60) * 60 * 1000);
        const projectName = `project-${s % 8}`;

        await client.query(
          `INSERT INTO sessions (id, organization_id, user_id, machine_id, provider_id, external_session_id, project_name, started_at, ended_at, raw_metadata)
           VALUES ($1, $2, $3, $4, (SELECT id FROM providers WHERE name = $5), $6, $7, $8, $9, $10)`,
          [sessionId, org.id, user.id, machine.id, provider, `ext-sess-${s}`, projectName, startDate, endDate, JSON.stringify({ source: 'seed', iteration: s })]
        );

        // Events per session: 50-200
        const eventsInSession = Math.min(randomInt(50, 200), targetEvents - orgEvents);

        // Batch insert events in groups of 50
        const BATCH = 50;
        for (let batchStart = 0; batchStart < eventsInSession; batchStart += BATCH) {
          const batchEnd = Math.min(batchStart + BATCH, eventsInSession);
          const values: string[] = [];
          const params: unknown[] = [];
          let paramIdx = 1;

          for (let e = batchStart; e < batchEnd; e++) {
            const model = models[s % models.length];
            const inputTokens = randomInt(500, 15000);
            const outputTokens = randomInt(200, 8000);
            const cacheRead = randomInt(0, 3000);
            const cacheWrite = randomInt(0, 1000);
            // Realistic pricing: Claude Sonnet ~$3/M input, ~$15/M output
            const inputCost = inputTokens * 0.000003;
            const outputCost = outputTokens * 0.000015;
            const cost = inputCost + outputCost;
            const eventTime = new Date(startDate.getTime() + randomInt(0, Math.max(1, endDate.getTime() - startDate.getTime())));
            const eventType = eventTypes[e % eventTypes.length];

            values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
            params.push(
              org.id, sessionId, eventTime, eventType, model,
              inputTokens, outputTokens, cacheRead, cacheWrite,
              cost, JSON.stringify({ source: 'seed' })
            );
          }

          await client.query(
            `INSERT INTO events (organization_id, session_id, event_time, event_type, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, estimated_cost, payload)
             VALUES ${values.join(', ')}`,
            params
          );

          orgEvents += batchEnd - batchStart;
          totalEvents += batchEnd - batchStart;
        }
      }
      console.log(`  ✅ ${org.name}: ${orgEvents.toLocaleString()} events created`);
    }
    console.log(`  📊 Total events: ${totalEvents.toLocaleString()}`);

    // ── Daily Usage Aggregates ─────────────────────────────────────
    console.log('\n── Creating Daily Usage Aggregates ──');
    for (const org of orgs) {
      if (org.name === 'Startup Labs') continue;
      for (let d = 0; d < 90; d++) {
        const date = pastDate(d);
        const dateStr = date.toISOString().split('T')[0];
        const totalTokens = randomInt(10000, 200000);
        const totalCost = totalTokens * 0.000005;
        await client.query(
          `INSERT INTO daily_usage (organization_id, usage_date, total_sessions, total_users, total_tokens, total_cost)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (organization_id, usage_date) DO UPDATE SET
             total_sessions = EXCLUDED.total_sessions, total_users = EXCLUDED.total_users,
             total_tokens = EXCLUDED.total_tokens, total_cost = EXCLUDED.total_cost`,
          [org.id, dateStr, randomInt(5, 80), randomInt(1, 10), totalTokens, totalCost]
        );
      }
      console.log(`  ✅ ${org.name}: 90 days of daily usage`);
    }

    // ── Daily Provider Usage ───────────────────────────────────────
    console.log('\n── Creating Daily Provider Usage ──');
    for (const org of orgs) {
      if (org.name === 'Startup Labs') continue;
      for (const provider of providers) {
        for (let d = 0; d < 90; d++) {
          const date = pastDate(d);
          const dateStr = date.toISOString().split('T')[0];
          const tokens = randomInt(5000, 80000);
          await client.query(
            `INSERT INTO daily_provider_usage (organization_id, provider_id, usage_date, total_sessions, total_tokens, total_cost)
             VALUES ($1, (SELECT id FROM providers WHERE name = $2), $3, $4, $5, $6)
             ON CONFLICT (organization_id, provider_id, usage_date) DO UPDATE SET
               total_sessions = EXCLUDED.total_sessions, total_tokens = EXCLUDED.total_tokens, total_cost = EXCLUDED.total_cost`,
            [org.id, provider, dateStr, randomInt(1, 30), tokens, tokens * 0.000005]
          );
        }
      }
      console.log(`  ✅ ${org.name}: provider usage for all providers`);
    }

    // ── Sync Jobs ──────────────────────────────────────────────────
    console.log('\n── Creating Sync Jobs ──');
    const syncDefsByOrg: Record<string, { machineIdx: number; status: string }[]> = {
      'AiInsight Test Org': [
        { machineIdx: 0, status: 'COMPLETED' }, { machineIdx: 1, status: 'COMPLETED' },
        { machineIdx: 2, status: 'COMPLETED' }, { machineIdx: 3, status: 'COMPLETED' },
        { machineIdx: 4, status: 'COMPLETED' }, { machineIdx: 5, status: 'RUNNING' },
      ],
      'Acme Corporation': [
        { machineIdx: 0, status: 'COMPLETED' }, { machineIdx: 1, status: 'COMPLETED' },
        { machineIdx: 2, status: 'COMPLETED' },
      ],
      'Enterprise Inc': [
        { machineIdx: 0, status: 'COMPLETED' }, { machineIdx: 1, status: 'COMPLETED' },
        { machineIdx: 2, status: 'COMPLETED' }, { machineIdx: 3, status: 'COMPLETED' },
        { machineIdx: 4, status: 'COMPLETED' }, { machineIdx: 5, status: 'COMPLETED' },
        { machineIdx: 6, status: 'COMPLETED' }, { machineIdx: 7, status: 'COMPLETED' },
        { machineIdx: 0, status: 'RUNNING' }, { machineIdx: 1, status: 'RUNNING' },
      ],
    };

    for (const org of orgs) {
      const defs = syncDefsByOrg[org.name] || [];
      const machines = machinesByOrg[org.name];
      for (const sd of defs) {
        const machine = machines[sd.machineIdx % machines.length];
        const provider = providers[sd.machineIdx % providers.length];
        const startedAt = randomDate(3);
        const completedAt = sd.status === 'COMPLETED' ? new Date(startedAt.getTime() + randomInt(5, 300) * 1000) : null;
        const recordsProcessed = sd.status === 'COMPLETED' ? randomInt(100, 5000) : 0;
        await client.query(
          `INSERT INTO sync_jobs (machine_id, provider, started_at, completed_at, records_processed, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [machine.id, provider, startedAt, completedAt, recordsProcessed, sd.status]
        );
      }
      console.log(`  ✅ ${org.name}: ${defs.length} sync jobs`);
    }

    // ── Invitations ────────────────────────────────────────────────
    console.log('\n── Creating Invitations ──');
    type InvitationDef = { email: string; accepted: boolean };
    const invDefsByOrg: Record<string, InvitationDef[]> = {
      'AiInsight Test Org': [
        { email: 'newdev@aiinsight.local', accepted: false },
        { email: 'contractor@aiinsight.local', accepted: false },
        { email: 'intern@aiinsight.local', accepted: false },
      ],
      'Acme Corporation': [
        { email: 'newhire@acme.local', accepted: false },
        { email: 'consultant@acme.local', accepted: false },
      ],
      'Enterprise Inc': [
        { email: 'joined@enterprise.local', accepted: true },
      ],
    };

    for (const org of orgs) {
      const defs = invDefsByOrg[org.name] || [];
      for (const inv of defs) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = randomFutureDate(30);
        const acceptedAt = inv.accepted ? randomDate(2) : null;
        await client.query(
          `INSERT INTO organization_invitations (organization_id, email, role, token, expires_at, accepted_at)
           VALUES ($1, $2, 'member', $3, $4, $5)`,
          [org.id, inv.email, token, expiresAt, acceptedAt]
        );
        console.log(`  ✅ ${inv.email} → ${org.name} (accepted=${inv.accepted})`);
      }
    }

    // ── Email Verifications ────────────────────────────────────────
    console.log('\n── Creating Email Verifications ──');
    for (const org of orgs) {
      const users = usersByOrg[org.name];
      for (const user of users) {
        // Create a verification token for every user
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = randomFutureDate(7);
        const verifiedAt = user.role === 'owner' || user.role === 'admin' ? randomDate(30) : null;
        await client.query(
          `INSERT INTO email_verifications (user_id, token, expires_at, verified_at)
           VALUES ($1, $2, $3, $4)`,
          [user.id, token, expiresAt, verifiedAt]
        );
      }
      console.log(`  ✅ ${org.name}: ${users.length} verification tokens`);
    }

    // ── Agent Tokens (for online machines) ─────────────────────────
    console.log('\n── Creating Agent Tokens ──');
    for (const org of orgs) {
      const machines = machinesByOrg[org.name];
      for (const machine of machines) {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = await argon2.hash(token);
        const expiresAt = randomFutureDate(90);
        const lastUsedAt = randomDate(1);
        await client.query(
          `INSERT INTO agent_tokens (machine_id, token_hash, expires_at, last_used_at)
           VALUES ($1, $2, $3, $4)`,
          [machine.id, tokenHash, expiresAt, lastUsedAt]
        );
      }
      console.log(`  ✅ ${org.name}: ${machines.length} agent tokens`);
    }

    await client.query('COMMIT');

    // ── Summary ────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('  SEED COMPLETE — Summary');
    console.log('═'.repeat(60));
    console.log(`  Organizations:    4`);
    console.log(`  Users:            ${Object.values(usersByOrg).flat().length}`);
    console.log(`  Teams:            ${Object.values(teamsByOrg).flat().length}`);
    console.log(`  Machines:         ${Object.values(machinesByOrg).flat().length}`);
    console.log(`  Sessions/Events:  ~${totalEvents.toLocaleString()} events`);
    console.log(`  Enrollment Keys:  ${Object.values(keysByOrg).flat().length}`);
    console.log('\n  Login credentials:');
    console.log('    password123 for all users');
    console.log('\n  Key users:');
    console.log('    owner@aiinsight.local    (AiInsight Test Org, owner)');
    console.log('    admin@acme.local         (Acme Corporation, owner)');
    console.log('    founder@startuplabs.local (Startup Labs, owner)');
    console.log('    admin@enterprise.local    (Enterprise Inc, owner)');
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
