# AIInsight Beta Readiness Audit (RC-2)

**Date:** 2026-06-20
**Auditor:** Automated RC-2 Audit
**Status:** NOT READY FOR LAUNCH

---

## Executive Summary

**Beta Completion: 78%**

Core functionality is implemented across all subsystems, but 6 critical authentication bugs block the onboarding journey. A new user cannot install, login, or sync data. The dashboard, team collaboration, machines, emails, and sync engine are solid — the auth layer is the single point of failure.

---

## PART 1 — Authentication

| Item | Status |
|------|--------|
| Registration | **DONE** |
| Email verification | **DONE** |
| Login | **DONE** |
| Logout | **DONE** |
| Refresh token rotation | **DONE** |
| Forgot password | **DONE** |
| Reset password | **DONE** |
| Protected routes | **DONE** |
| Session persistence | **DONE** |

### Issues

1. **[HIGH]** Frontend does NOT store refresh token on login (`auth-context.tsx:54-61`). Silent refresh broken after first JWT expiry. Users logged out after 24h.

---

## PART 2 — API Key Flow

| Item | Status |
|------|--------|
| Create key | **DONE** |
| List keys | **DONE** |
| Revoke key | **DONE** |
| Copy key (once) | **DONE** |
| last_used_at | **DONE** |
| Prefix format | **PARTIAL** |
| Hashing | **PARTIAL** |
| Tenant isolation | **DONE** |

### Critical Issues

1. **[P0]** Prefix stored is 13 chars (`aisk_a1b2c3d4`) but auth extracts 8 chars (`slice(0,8)` = `aisk_a1b`). SQL lookup NEVER matches. New keys cannot authenticate.
   - `apps/dashboard-api/src/middlewares/auth.middleware.ts:78`
   - `apps/dashboard-api/src/services/dashboard.service.ts:647`
   - `apps/ingestion-api/src/middlewares/auth.middleware.ts:57`

2. **[P0]** Ingestion API uses `bcrypt.compare` (`ingestion-api auth.middleware.ts:69`) but keys are hashed with `argon2`. All ingestion API key auth is broken.

3. **[P0]** Ingestion API `startsWith('ai_')` does not match `aisk_` prefix. Keys routed to JWT auth.
   - `apps/ingestion-api/src/middlewares/auth.middleware.ts:41`

4. **[MEDIUM]** Agent login path (`dashboard.service.ts:659`) bypasses debounced `updateApiKeyLastUsed` — raw `NOW()` update on every login.

---

## PART 3 — Agent Experience

| Item | Status |
|------|--------|
| `aiinsight login` | **DONE** |
| `aiinsight sync` | **DONE** |
| `aiinsight status` | **DONE** |
| `aiinsight config` | **DONE** |
| `aiinsight providers` | **DONE** |
| `aiinsight logout` | **DONE** |
| `aiinsight doctor` | **DONE** |
| Config persistence | **DONE** |
| Machine registration | **DONE** |
| Provider discovery | **DONE** |
| Heartbeat | **DONE** |
| Retry queue | **DONE** |
| Single uploader | **PARTIAL** |
| Queue recovery | **DONE** |

### Issues

1. **[MEDIUM]** API key prompt not masked in `login.ts:107`. Key echoed in plaintext.
2. **[LOW]** BatchUploader not shared in continuous mode. SyncLoop creates own instances (`syncLoop.ts:22-23`). 3 separate uploaders in continuous mode.
3. **[LOW]** `agentToken` saved but never used for API calls. Dead code.
4. **[LOW]** Sync interval from config ignored. SyncLoop hardcodes 5min (`syncLoop.ts:20`). `SyncConfig` type lacks `syncInterval` field.
5. **[LOW]** Dual machine ID sources — `getSyncConfig()` always uses local file (`config.ts:206`), overriding server-assigned ID.

---

## PART 4 — Agent Login Flow

| Item | Status |
|------|--------|
| POST /api/v1/agents/login | **DONE** |
| Machine enrollment | **DONE** |
| Agent token | **DONE** |
| Config endpoint | **DONE** |
| Sync interval | **PARTIAL** |
| Config file creation | **DONE** |

### Issues

1. **[LOW]** `agentToken` stored in config but never referenced for API calls. `BatchUploader` and `IngestionClient` use `apiKey` only.

---

## PART 5 — Sync Engine

| Item | Status |
|------|--------|
| Historical sync | **DONE** |
| Incremental sync | **DONE** |
| Checksum tracking | **DONE** |
| Watermarks | **DONE** |
| Queue recovery | **DONE** |
| Deduplication | **DONE** |
| Event uniqueness | **DONE** |
| Heartbeat | **DONE** |
| Provider auto-discovery | **PARTIAL** |

### Notes

- Provider list hardcoded in 3 locations (adapter map + 2 filter arrays). No runtime discovery.
- `registerAdapter()` API exists but is never called externally.

---

## PART 6 — Providers

| Provider | Parser | Hist | Incr | Cost | Adapter | Status |
|----------|--------|------|------|------|---------|--------|
| Claude | **DONE** | **DONE** | **DONE** | **PARTIAL** (deferred to server) | **DONE** | Registered |
| Codex | **DONE** (ext) | **DONE** | **DONE** | **DONE** | **DONE** | Registered |
| Cursor | **DONE** (ext) | **DONE** | **DONE** | **DONE** | **DONE** | Registered |
| Gemini | **DONE** (ext) | **DONE** | **DONE** | **DONE** | **DONE** | Registered |
| Warp | **DONE** (ext) | **DONE** | **DONE** | **DONE** | **DONE** | Registered |
| OpenCode | **DONE** (ext) | **DONE** | **DONE** | **DONE** | **DONE** | Registered |

### Notes

- Claude is special-cased with inline discovery/parsing in sync engine.
- All other providers use generic `Provider.discoverSessions()` / `Provider.createSessionParser()` delegation.
- Two-layer deduplication: client-side (`deduplicationKey` + `seenKeys`) + server-side (DB uniqueness).
- Claude sets `costUSD = 0` in sync adapter; all other providers calculate locally.

---

## PART 7 — Machines

| Item | Status |
|------|--------|
| Machines list page | **DONE** |
| Machine detail page | **DONE** |
| Online/offline status | **DONE** |
| Heartbeat updates | **DONE** |
| Last seen | **DONE** |
| Recent sessions | **DONE** |

### Notes

- Offline detection job runs every 60s, sets machines to OFFLINE when `last_seen < NOW() - INTERVAL '5 minutes'`.
- List page shows status badges with Wifi/WifiOff icons.
- Detail page shows stats, provider breakdown, recent sessions.

---

## PART 8 — Team Collaboration

| Item | Status |
|------|--------|
| Members page | **DONE** |
| Invite form | **DONE** |
| Role selection | **DONE** |
| Invitation email | **DONE** |
| Pending invites | **DONE** |
| Resend invite | **DONE** |
| Revoke invite | **DONE** |
| Accept invitation | **DONE** |
| Set password page | **DONE** |
| Organization join | **DONE** |
| RBAC | **DONE** |

### Notes

- Frontend web middleware checks auth only (not role). All RBAC enforced server-side. Correct pattern.
- No frontend-level role gating (e.g., hiding "Invite Member" from non-admins). Minor UX issue.

---

## PART 9 — Email System

| Item | Status |
|------|--------|
| Welcome email | **DONE** |
| Verify email | **DONE** |
| Password reset | **DONE** |
| Invitation email | **DONE** |
| Agent connected | **DONE** |
| Sync completed | **DONE** |
| Template variables | **DONE** |
| APP_URL consistency | **PARTIAL** |
| Resend integration | **DONE** |

### Issues

1. **[LOW]** Secondary fallback inconsistent: `DASHBOARD_URL` in 4 places, `FRONTEND_URL` in 1 place (`dashboard.service.ts:698`).

---

## PART 10 — Dashboard

| Item | Status |
|------|--------|
| Overview | **DONE** |
| Sessions | **DONE** |
| Session details | **DONE** |
| Users | **DONE** |
| Machines | **DONE** |
| Providers | **DONE** |
| Settings | **DONE** |
| API keys | **DONE** |
| Onboarding | **DONE** |
| Charts (8 types) | **DONE** |
| Filters | **DONE** |
| Sorting | **DONE** |
| Pagination | **DONE** |
| Responsive design | **DONE** |
| Error boundaries | **DONE** |
| Loading states | **DONE** |

### Notes

- All pages have loading skeletons, empty states, error boundaries.
- Responsive: mobile sidebar, responsive grids, overflow handling.
- 8 chart types: Area, Bar, Donut, Line, StackedBar, Heatmap, Sparkline, Tooltip.
- Machines page uses direct `fetch()` instead of centralized API client. Minor inconsistency.

---

## PART 11 — Security

| Item | Status |
|------|--------|
| JWT secrets required | **PARTIAL** (no min length check) |
| RBAC | **DONE** |
| Tenant isolation | **DONE** |
| API key hashing | **PARTIAL** (ingestion uses bcrypt) |
| Rate limiting | **PARTIAL** (only auth routes) |
| Helmet | **DONE** |
| CORS | **PARTIAL** (permissive default, ingestion has none) |
| No hardcoded secrets | **DONE** |
| No body-trusted org IDs | **PARTIAL** (ingestion `/heartbeat` trusts body) |

### Issues

1. **[HIGH]** No JWT_SECRET minimum length validation. Short secrets accepted.
2. **[HIGH]** Rate limiting only on auth routes. `generalRateLimit` defined but never mounted.
3. **[MEDIUM]** CORS defaults to permissive when `CORS_ORIGIN` unset. Ingestion API has no CORS.
4. **[HIGH]** Ingestion `/heartbeat` endpoint has no auth, reads `organizationId` from body.

---

## PART 12 — Documentation Drift

| Doc | Status | Issues |
|-----|--------|--------|
| README.md | **OUTDATED** | References `aiinsight init` (does not exist) |
| docs/architecture.md | **OUTDATED** | Stale migrations (10 vs 14), phantom env var `JWT_REFRESH_SECRET`, broken phase links |
| docs/architecture/sync-engine.md | **CURRENT** | — |
| docs/product/agent-installation.md | **OUTDATED** | References `register` command (does not exist) |
| docs/agent-installation.md (root) | **OUTDATED** | Wrong Node version (20+ vs 22.13+), `register` command, phantom `better-sqlite3` |
| docs/api/ingestion-api.md | **CURRENT** | — |
| docs/api/dashboard-api.md | **CURRENT** | — |
| docs/architecture/deployment.md | **OUTDATED** | Stale migration count (13 vs 14) |
| docs/product/email-notifications.md | **CURRENT** | — |
| docs/product/getting-started.md | **CURRENT** | — |
| docs/user/getting-started.md | **OUTDATED** | References `init` command |
| docs/getting-started.md (root) | **OUTDATED** | Wrong Node version, `register` command |
| docs/troubleshooting.md | **OUTDATED** | Legacy `cb_` prefix as primary, missing colon in header syntax |
| docs/architecture/configuration.md | **CURRENT** | — |
| docs/architecture/overview.md | **CURRENT** | — |

### Cross-cutting Issues

1. `aiinsight init` referenced in 4 docs — does not exist.
2. `aiinsight register` referenced in 3 docs — does not exist.
3. Node.js version wrong in 2 docs (says 20+, actual requirement is 22.13+).
4. Migration count stale in 2 docs (lists 10-13, actual is 14).
5. Legacy `cb_` prefix shown as primary example in troubleshooting.

---

## PART 13 — Blog Readiness

### "Install AIInsight in 2 minutes and instantly visualize your AI coding activity."

**NO** — Exaggerated.

- Install itself is fast (`npm install -g aiinsight`). Plausible < 2 min.
- But user must: sign up, verify email, generate API key, login, sync, wait for historical sync.
- Historical sync alone can take 1-15 minutes.
- Realistic time from zero to first dashboard view: 5-20 minutes.
- Docs reference `init` command which does not exist.

### "Invite your team and understand AI usage across developers."

**YES** — Truthful.

- Full invitation flow: create, email, accept, set password.
- Per-user analytics: cost, sessions, tokens.
- Multi-user organizations and teams supported.

---

## PART 14 — Developer Experience

| Item | Status |
|------|--------|
| Fresh clone works | **PARTIAL** |
| Environment setup | **DONE** |
| Docker compose | **PARTIAL** (missing `NEXT_PUBLIC_API_URL` build arg) |
| Migrations work | **DONE** (14 migrations) |
| Tests run | **PARTIAL** (CLI tests exist, zero backend tests) |
| No hidden dependencies | **DONE** |
| Undocumented env vars | 6 found |

### Issues

1. **[MEDIUM]** Zero backend tests. Ingestion API, Dashboard API, Sync Engine, Analytics Engine all have `vitest` configured but no test files.
2. **[MEDIUM]** No root-level `lint` or `lint:all` script.
3. **[LOW]** Dashboard Web Dockerfile does not pass `NEXT_PUBLIC_API_URL` as build arg.
4. **[LOW]** 6 undocumented env vars: `REQUIRE_INGEST_AUTH`, `API_URL`, `NEXT_PUBLIC_APP_URL`, `AIINSIGHT_TZ`, `AIINSIGHT_VERBOSE`, `SYNC_INTERVAL` (partially documented).

---

## PART 15 — Operational Readiness

| Item | Status |
|------|--------|
| Health endpoints | **DONE** |
| Logging (Pino) | **DONE** |
| Retry mechanisms | **DONE** |
| Error handling | **PARTIAL** |
| Queue recovery | **DONE** |
| Graceful shutdown | **DONE** |

### Issues

1. **[LOW]** No 404 handler for undefined routes.
2. **[LOW]** No Zod error formatting middleware. Validation errors may leak stack traces.
3. **[LOW]** Health endpoints don't check full dependency chain (Dashboard API health OK even if Ingestion API is down).

---

## P0 Blockers (Must Fix Before Launch)

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| 1 | **API key prefix length mismatch** — `slice(0,8)` extracts 8 chars but `aisk_` prefix is 13 chars. SQL lookup NEVER matches. | `auth.middleware.ts:78`, `dashboard.service.ts:647`, `ingestion-api auth.middleware.ts:57` | NEW USERS CANNOT AUTHENTICATE |
| 2 | **Ingestion API bcrypt/argon2 mismatch** — Keys hashed with argon2, verified with bcrypt. All ingestion API key auth broken. | `ingestion-api auth.middleware.ts:69` | DATA CANNOT REACH CLOUD |
| 3 | **Ingestion API `aisk_` prefix detection** — `startsWith('ai_')` does not match `aisk_`. Keys misrouted to JWT auth. | `ingestion-api auth.middleware.ts:41` | Ingestion auth fails |
| 4 | **Frontend refresh token not stored on login** — Silent refresh broken after first JWT expiry. | `auth-context.tsx:54-61` | Users logged out after 24h |
| 5 | **Unauthenticated `/heartbeat` endpoint** — No auth, trusts body orgId. Can spoof machine heartbeats. | `ingestion-api health.route.ts:27-37` | Security vulnerability |
| 6 | **Rate limiting only on auth routes** — All other dashboard API routes unprotected. | `dashboard-api/src/index.ts:46` | DDoS risk |

---

## P1 Issues (Can Launch With)

| # | Issue | Impact |
|---|-------|--------|
| 1 | No JWT_SECRET min length validation | Weak secrets accepted |
| 2 | CORS defaults to permissive when `CORS_ORIGIN` unset | Security in production |
| 3 | Ingestion API has no CORS config | Security |
| 4 | API key prompt not masked in terminal | UX/security concern |
| 5 | Sync interval from config ignored by SyncLoop | Config has no effect |
| 6 | `agentToken` saved but never used | Dead code |
| 7 | Dual machine ID sources may diverge | Confusion |
| 8 | BatchUploader not shared in continuous mode | 3 separate instances |
| 9 | No 404 handler or Zod error formatting | Poor error UX |
| 10 | APP_URL fallback inconsistency | Partial email URLs |
| 11 | 7 doc files outdated | User confusion |
| 12 | Zero backend tests | No regression safety |
| 13 | 6 undocumented env vars | Operator confusion |
| 14 | `generalRateLimit` defined but never mounted | Wasted code |

---

## Readiness Assessment

| Target | Ready? | Blocking Issues |
|--------|--------|-----------------|
| Design Partners | **NO** | P0 #1-3 prevent login and sync |
| Blog Launch | **NO** | P0 blockers + docs reference non-existent commands |
| Node SEA Packaging | **NO** | Core auth flow broken |
| User Onboarding Docs | **NO** | Docs reference `init` and `register` commands |
| Developer Setup Docs | **PARTIAL** | Docker compose works but may break in container |
| Developer Testing Docs | **NO** | Zero backend tests to document |

---

## Completion Percentages

| Area | % |
|------|---|
| **Beta Completion** | **78%** |
| **Sync Engine Health** | **92%** |
| **Agent Experience Health** | **85%** |
| **Dashboard Health** | **95%** |
| **Team Collaboration Health** | **100%** |
| **Documentation Coverage** | **65%** |

---

## Immediate Next Steps

1. Fix P0 #1: Change `slice(0,8)` to `slice(0,13)` for `aisk_` keys (or store only first 8 chars as prefix)
2. Fix P0 #2: Replace `bcrypt.compare` with `argon2.verify` in ingestion API
3. Fix P0 #3: Change `startsWith('ai_')` to `startsWith('aisk_') || startsWith('cb_')` in ingestion API
4. Fix P0 #4: Store `refreshToken` in localStorage after login
5. Fix P0 #5: Add auth middleware to `/heartbeat` endpoint
6. Fix P0 #6: Mount `generalRateLimit` on non-auth routes
7. Re-audit after P0 fixes
