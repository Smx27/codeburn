# AIInsight Hosting & Package Distribution Audit (OPS-RC1)

## PART 1 — Workspace Inventory

| Name | Type | Purpose |
|------|------|---------|
| `apps/dashboard-api` | App | Analytics queries, user auth, and organization management |
| `apps/ingestion-api` | App | Multi-tenant event ingestion service |
| `apps/dashboard-web` | App | Next.js frontend analytics visualization |
| `packages/analytics-engine` | Internal Package | Data aggregation, rollups, and backfill jobs |
| `packages/auth-shared` | Shared Package | Shared API key utilities for APIs |
| `packages/distribution` | Shared Package | Centralized URLs, constants, build metadata |
| `packages/platform` | Shared Package | Cross-platform filesystem path helpers |
| `packages/sync-engine` | Library | Historical and incremental synchronization engine |
| `aiinsight` (root) | CLI | AIInsight CLI Agent (OSS) |

---

## PART 2 — NPM Publish Audit

| Package | Publishable | Public/Private | Notes |
|---------|-------------|----------------|-------|
| `aiinsight` (CLI root) | Yes | Public | Has README, license, version. Ready for publish. |
| `@aiinsight/sync-engine` | No | Private NPM / Internal | Missing README. Has proper exports. |
| `@aiinsight/platform` | No | Private NPM / Internal | Missing README. |
| `@aiinsight/distribution`| No | Private NPM / Internal | Missing README. |
| `@aiinsight/auth-shared` | No | Internal Only | Missing README. Only used by internal APIs. |
| `@aiinsight/analytics-engine` | No | Internal Only | Internal processing, DB connection required. |

*Criteria check:* Packages currently lack individual `README.md` files, making them unready for immediate public publish.

---

## PART 3 — Docker Deployment Audit

| App | Dockerfile Exists | Hostable | Dependencies |
|-----|-------------------|----------|--------------|
| `dashboard-api` | Yes | Yes | Postgres DB, Ingestion API (URL), Dashboard Web (URL), Mail Provider |
| `ingestion-api` | Yes | Yes | Postgres DB |
| `dashboard-web` | Yes | Yes | Dashboard API (URL) |

*All apps have a standalone multi-stage Dockerfile and can be hosted independently without `docker-compose`.*

---

## PART 4 — Static Deployment Audit

- **Marketing site:** N/A
- **Landing page:** N/A
- **Docs:** Static (Currently raw Markdown in `/docs`, ready to be built statically e.g., via Nextra/Docusaurus)
- **Blog:** N/A
- **Dashboard web:** SSR Required (Next.js using standard build/start, not exported as static)

---

## PART 5 — Database Dependencies

- **Postgres:** Required
- **Redis:** Not needed
- **S3:** Not needed
- **Resend / SMTP:** Optional (Can be mocked/disabled if `MAIL_PROVIDER` is unset or customized)
- **GitHub:** Optional (Release API used for downloading latest binaries, no infra needed)

---

## PART 6 — Background Services

| Service | Deployment Model |
|---------|------------------|
| `offlineDetection` (Machine status) | Embedded (Runs via `setInterval` in `dashboard-api`) |
| `dailyAggregation` (Analytics) | Separate Container / Cron Job (Triggered via `tsx src/jobs/dailyAggregation.job.ts`) |
| `historicalBackfill` (Analytics) | Separate Container / Cron Job |

---

## PART 7 — Environment Variables

### `dashboard-api`
- **Required:** `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `APP_URL`, `INGESTION_API_URL`
- **Optional:** `PORT`, `NODE_ENV`, `LOG_LEVEL`, `MAIL_PROVIDER`, `RESEND_API_KEY`, `SMTP_*`
- **Secrets:** `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `SMTP_PASS`
- **Defaults:** `PORT=3002`, `NODE_ENV=development`, `LOG_LEVEL=info`

### `ingestion-api`
- **Required:** `DATABASE_URL`, `JWT_SECRET`
- **Optional:** `PORT`, `NODE_ENV`, `LOG_LEVEL`, `REQUIRE_INGEST_AUTH`
- **Secrets:** `DATABASE_URL`, `JWT_SECRET`
- **Defaults:** `PORT=3001`, `LOG_LEVEL=info`

### `dashboard-web`
- **Required:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`
- **Optional:** `NEXT_PUBLIC_INGESTION_API_URL`
- **Secrets:** None
- **Defaults:** None

*(Verified `.env.example` exists and no secrets are committed).*

---

## PART 8 — Health Checks

- `/health`: Exists (Checks DB connectivity) in `dashboard-api` and `ingestion-api`.
- `/version`: Exists.
- `/readiness`: **Missing**
- `/liveness`: **Missing**

**Status: PARTIAL**

---

## PART 9 — Publishability Matrix

- **CLI (`aiinsight`):** PUBLIC NPM
- **Sync engine:** PRIVATE NPM
- **Provider adapters:** PRIVATE NPM (Inside sync engine)
- **Auth shared:** INTERNAL ONLY
- **Platform package:** PRIVATE NPM
- **Distribution package:** PRIVATE NPM
- **Dashboard API:** DOCKER SERVICE
- **Ingestion API:** DOCKER SERVICE
- **Dashboard web:** DOCKER SERVICE
- **Docs:** STATIC APP
- **Analytics engine:** INTERNAL ONLY

---

## PART 10 — Hosting Recommendations

**Minimal production topology (No docker-compose):**

- **Database:** Managed Postgres (External)
- **Dashboard API:** Serverless Container / VPS
- **Ingestion API:** Serverless Container / VPS
- **Dashboard Web:** Vercel / Serverless Container
- **Analytics Worker:** Serverless Cron executing the `analytics-engine` jobs daily.

*No Redis or Object Storage needed.*

---

## PART 11 — CI/CD Readiness

- **GitHub Actions:** Exists (`binary-validation.yml`, `release.yml`)
- **npm publish workflow:** **Missing**
- **Docker build workflow:** **Missing**
- **Release workflow:** Exists (Builds platform binaries)
- **Semantic versioning:** Exists (`0.1.0`, `0.9.12`)

**Status: PARTIAL**

---

## FINAL REPORT

**NPM Packages Ready:**
- `aiinsight` (CLI root)

**Docker Deployable Apps:**
- `dashboard-api`
- `ingestion-api`
- `dashboard-web`

**Static Deployable Apps:**
- `docs` (requires a static site generator wrapper)

**Internal Only Components:**
- `@aiinsight/analytics-engine`
- `@aiinsight/auth-shared`

**Missing Dockerfiles:**
- Analytics worker container (for running cron jobs)
- Docs

**Hosting Readiness %:** 90% (Missing specific readiness/liveness probes and cron container definition)
**Package Publishing Readiness %:** 50% (Missing individual package READMEs and automated npm publish workflows)

**Ready For:**
- **npm publishing:** NO (Needs workflow and READMEs for workspace packages)
- **Independent Docker deployments:** YES
- **VPS hosting:** YES
- **Railway:** YES
- **Fly.io:** YES
- **Render:** YES
- **DigitalOcean:** YES
- **Kubernetes:** NO (Missing liveness/readiness probes, Helm charts)
