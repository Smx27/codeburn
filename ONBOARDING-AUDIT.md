# AIInsight User Onboarding + Agent Experience Audit

**Date:** 2026-06-20
**Auditor:** Automated Codebase Audit
**Scope:** User journey from signup to synced data, agent commands, email flows

---

## User Journey Verification

| Step | Status | Evidence |
|------|--------|----------|
| 1. Landing Page | **WORKS** | Full marketing page with CTAs |
| 2. Register | **WORKS** | `POST /api/v1/auth/register` creates user + org + team |
| 3. Verify Email | **BROKEN** | Frontend page is a static stub; never reads `?token=` param; not enforced at login |
| 4. Dashboard | **WORKS** | JWT issued on login; dashboard renders |
| 5. Generate API Key | **WORKS** | `POST /api/v1/api-keys/` with `adminOrAbove` guard |
| 6. Download Agent | **BLOCKER** | References `curl -fsSL https://get.aiinsight.dev \| sh` — URL does not exist; no installer |
| 7. `aiinsight login` | **BLOCKER** | Command does not exist; no interactive prompt |
| 8. Paste API Key | **BLOCKER** | No command to accept and persist API key |
| 9. Agent authenticated | **BLOCKER** | No enrollment flow; user must manually edit JSON config |
| 10. Config persisted | **BLOCKER** | No code path writes `sync.*` section to `config.json` |
| 11. Machine registered | **WORKS** | `POST /api/v1/agents/register` with enrollment key works |
| 12. Historical sync | **WORKS** | `SyncEngine` uploads all local sessions on first run |
| 13. Heartbeat | **BROKEN** | Endpoint exists; sync engine never calls it; `IngestionClient.healthCheck()` is dead code |
| 14. Incremental sync | **WORKS** | Checksum + timestamp filtering uploads only new data |
| 15. Dashboard sessions visible | **WORKS** | Sessions page, session detail, charts all render |
| 16. Invite teammate | **BROKEN** | Settings > Members shows "Coming Soon"; no frontend UI |
| 17. Teammate receives email | **WORKS** | Invitation email template exists and sends |
| 18. Accept invitation | **BLOCKER** | Login page ignores `?invitation=TOKEN`; no accept page exists |
| 19. Set password | **BLOCKER** | Temporary password auto-generated but never disclosed; no set-password page |
| 20. Login | **BLOCKER** | Invited user cannot log in — unknown temporary password |
| 21. Second machine syncs | **WORKS** | Backend supports multi-machine via hostname upsert |

**Journey Verdict: FAILS** — 8 blockers prevent completion.

---

## Agent Commands

| Command | Status | Notes |
|---------|--------|-------|
| `aiinsight login` | **NOT IMPLEMENTED** | No command, no prompt, no enrollment flow |
| `aiinsight sync` | **DONE** | Fully working with `--api-key`, `--org-id`, `--api-url`, `--once` flags |
| `aiinsight status` | **PARTIAL** | Shows cost/calls only; dead code for org/machine/connection status never wired |
| `aiinsight config` | **NOT IMPLEMENTED** | Referenced in error messages but never created |
| `aiinsight providers` | **NOT IMPLEMENTED** | `renderProviderList()` exists but is never called |
| `aiinsight logout` | **NOT IMPLEMENTED** | No way to clear credentials programmatically |
| `aiinsight doctor` | **PARTIAL** | Checks config file + provider dirs; does NOT check network, API key validity, or system requirements |

### Dead Code (unwired UI functions)

| Function | File | Status |
|----------|------|--------|
| `renderWelcome()` | `src/ui/success.ts:70-82` | Dead — never called |
| `renderOrganizationInfo()` | `src/ui/status.ts:21-29` | Dead — never called |
| `renderAgentStatus()` | `src/ui/status.ts:32-47` | Dead — never called |
| `renderProviderList()` | `src/ui/status.ts:49-61` | Dead — never called |
| `renderMissingConfig()` | `src/ui/errors.ts:20-22` | References nonexistent `aiinsight config` command |

---

## Agent Login Endpoint

| Check | Status | Evidence |
|-------|--------|----------|
| `POST /agent/login` | **NOT IMPLEMENTED** | No such endpoint exists |
| Agent registration | **DONE** | `POST /api/v1/agents/register` — validates enrollment key via argon2, creates machine, returns JWT |
| API key validation | **DONE** | Enrollment keys (`ai_live_` prefix) validated via argon2; API keys (`cb_` prefix) validated via argon2 |
| Machine registration | **DONE** | `INSERT ... ON CONFLICT (organization_id, hostname) DO UPDATE` upserts machine |
| Organization resolution | **DONE** | Org ID extracted from enrollment key record |
| Sync interval | **DONE** | Returned as hardcoded `300` (5 minutes) in register response and config endpoint |
| Config response | **DONE** | `GET /api/v1/agents/config` returns `{ apiUrl, organizationId, machineId, syncInterval, environment }` |

### Authentication Flow

```
POST /api/v1/agents/register (public, no auth)
  Body: { enrollmentKey, hostname, os, architecture, agentVersion }
  → Validates enrollment key via argon2
  → Creates/updates machine (ON CONFLICT upsert)
  → Generates agent JWT (24h) with role='agent' + machineId
  → Generates persistent agent_token (90-day, hash stored in DB)
  → Sends "agent connected" email to org admin
  Returns: { machineId, organizationId, agentToken, syncInterval: 300 }

POST /api/v1/agents/heartbeat (public, validates agentToken in body)
  Body: { agentToken, machineId }
  → Verifies JWT, updates machine last_seen + status

GET /api/v1/agents/config (JWT-auth via Authorization header)
  → Returns: { apiUrl, organizationId, machineId, syncInterval: 300, environment }
```

---

## Local Config

| Check | Status | Evidence |
|-------|--------|----------|
| `~/.config/aiinsight/config.json` | **DONE** | Created on first write via `saveConfig()` |
| Stores `organizationId` | **DONE** | `config.sync.organizationId` |
| Stores `machineId` | **DONE** | `config.sync.machineId` + separate `machine-id` file |
| Stores `apiUrl` | **DONE** | `config.sync.apiUrl` |
| Stores `syncInterval` | **NOT IMPLEMENTED** | `syncInterval` not in config schema; hardcoded to 300 in sync engine |
| No plaintext secrets | **NO** | API key stored in plaintext JSON; no encryption at rest |

### Config Schema

```typescript
// src/config.ts:22-64
type AiInsightConfig = {
  currency?: { code: string; symbol?: string }
  devin?: { acuUsdRate?: number }
  plan?: Plan
  plans?: PlanConfigMap
  modelAliases?: Record<string, string>
  claudeConfigDirs?: string[]
  localModelSavings?: Record<string, string>
  proxyPaths?: string[]
  sync?: {
    organizationId?: string
    machineId?: string
    apiUrl?: string
    apiKey?: string        // ← stored in plaintext
    enabled?: boolean
  }
}
```

### Critical Gap

**No code path writes `sync.*` to config.json.** The `getSyncConfig()` function reads it, but no CLI command or enrollment flow persists it. Users must manually edit the JSON file.

---

## Sync Engine

| Check | Status | Evidence |
|-------|--------|----------|
| Historical sync | **DONE** | `runFullHistoricalSync()` uploads all providers on first run |
| Incremental sync | **DONE** | `filterNewCalls()` with checksum + timestamp filtering |
| Heartbeat | **BROKEN** | `IngestionClient.healthCheck()` exists but is dead code; never called |
| Retries | **DONE** | Exponential backoff (1s, 2s, 4s), max 3 retries |
| Queue recovery | **DONE** | Disk-persisted queue in `~/.config/aiinsight/upload-queue/`; loaded on startup |
| Checksum tracking | **DONE** | SHA-256 file checksums stored in `~/.config/aiinsight/sync-state/` |
| Provider discovery | **PARTIAL** | Requires external injection; no auto-discovery |

### Bugs Found

| Bug | Severity | Location |
|-----|----------|----------|
| Orphaned queue files accumulate after successful upload | LOW | `batchUploader.ts:40-56` |
| No heartbeat/liveness signal from sync engine | MEDIUM | `syncLoop.ts:56-64` |
| Private field access via bracket notation | LOW | `historicalSync.service.ts:133`, `incrementalSync.service.ts:152` |
| Three separate BatchUploader instances with isolated queues | MEDIUM | `index.ts:44-45` vs `historicalSync.service.ts:26` vs `incrementalSync.service.ts:26` |

---

## Email Templates

| Template | File | HTML | Plaintext | Actually Sent | Notes |
|----------|------|------|-----------|---------------|-------|
| Welcome | `templates/welcome.ts` | YES | YES | YES | Sent on registration |
| Verify Email | `templates/verify-email.ts` | YES | YES | YES | 24h expiry, branded |
| Password Reset | `templates/password-reset.ts` | YES | YES | YES | 1h expiry, security notice |
| Invitation | `templates/invite.ts` | YES | YES | YES | 7-day expiry, role display |
| Agent Connected | `templates/agent-connected.ts` | YES | YES | YES | Notification to org admin |
| Sync Completed | `templates/sync-completed.ts` | YES | YES | **NO (dead code)** | Template exists, never called |

### Issues

- **Sync Completed** template is fully implemented but never wired
- **Invitation email** hardcodes `inviterName: 'Your team'` instead of actual user name
- **Inconsistent env vars**: Welcome/Invite use `DASHBOARD_URL`; Verify/Reset use `FRONTEND_URL`
- **Docs inaccurate**: `docs/email-templates.md` lists wrong variables and wrong file paths

---

## Invitation Flow

| Step | Backend | Frontend | Status |
|------|---------|----------|--------|
| 1. Invite member | `POST /api/v1/invitations/` — DONE | Settings > Members — **"Coming Soon"** | **BROKEN** |
| 2. Email sent | `invite.ts` template — DONE | — | **DONE** |
| 3. Accept token | `POST /api/v1/invitations/accept` — DONE | Login page ignores `?invitation=` param | **BROKEN** |
| 4. Set password | Auto-generated temp password — **NEVER DISCLOSED** | No set-password page | **BROKEN** |
| 5. Login | Works if user knows password | User does not know temp password | **BROKEN** |
| 6. Org join | User created with `organization_id` — DONE | — | **DONE** |
| 7. RBAC | Role from invitation stored in JWT — DONE | — | **DONE** |

### Critical Bugs

1. **No password-setting flow** — `acceptInvitation` generates `temporary-password-<hex>` that is never shown to anyone
2. **Login page ignores invitation tokens** — URL param `?invitation=` is never read
3. **No frontend for invitation lifecycle** — Zero invitation-related API functions in `api.ts`
4. **Resend hardcodes role** — `resendInvitation` always sends `role: 'member'` regardless of actual role

---

## Blog Readiness

**Can we honestly write:**
> "Install AIInsight in 2 minutes and instantly visualize your AI coding activity"

**NO.**

### Blockers

1. **No installer exists** — `curl -fsSL https://get.aiinsight.dev | sh` is a dead link
2. **No `aiinsight login` command** — Users cannot authenticate
3. **No `aiinsight configure` command** — Users cannot configure the agent
4. **Manual JSON editing required** — Users must hand-edit `~/.config/aiinsight/config.json`
5. **Invitation flow broken** — Team collaboration does not work
6. **Email verification broken** — Frontend pages are stubs

### What would make it true

- A working installer script or npm global install
- `aiinsight login` that prompts for API key and persists config
- `aiinsight sync` that auto-discovers providers and starts syncing
- Working email verification and invitation flows

---

## Final Verdict

| Metric | Status |
|--------|--------|
| **Ready For Node SEA Packaging** | **NO** |
| **Ready For Design Partners** | **NO** |
| **Ready For Blog Launch** | **NO** |

### Why NOT Ready

The sync engine and ingestion API are production-quality. The dashboard is polished. The marketing site looks great.

**But the user cannot get from signup to data.**

The critical path is:
1. Register → works
2. Generate API key → works
3. Install agent → **no installer exists**
4. Configure agent → **no command exists**
5. Start syncing → **works if manually configured**
6. See data → works

Steps 3-4 are completely missing. A design partner would need to:
1. Clone the repo
2. Build from source
3. Manually create `~/.config/aiinsight/config.json`
4. Manually set `sync.apiKey`, `sync.organizationId`, `sync.apiUrl`
5. Run `aiinsight sync --once`

This is not a 2-minute experience. This is a developer-contribution experience.

### Minimum Viable Beta Requirements

| Priority | Item | Effort |
|----------|------|--------|
| P0 | `aiinsight login` command — prompts for API key, calls `POST /api/v1/agents/register`, persists config | 1 day |
| P0 | Agent installer script — `curl` one-liner that installs the CLI | 1 day |
| P0 | Invitation frontend — Members tab with invite form + accept flow | 2 days |
| P0 | Set password page — `/accept-invitation` that reads token and prompts for password | 1 day |
| P1 | `aiinsight config` command — view/edit config | 0.5 day |
| P1 | `aiinsight logout` command — clear credentials | 0.5 day |
| P1 | Heartbeat from sync engine | 0.5 day |
| P1 | Fix forgot-password frontend stubs | 0.5 day |
| P1 | Fix verify-email frontend stubs | 0.5 day |

**Estimated total: ~7 days of focused work to reach beta-ready.**
