// ── App URLs ───────────────────────────────────────────────────────────
// Centralized URL constants. All URLs in the codebase should reference
// these instead of hardcoding. Override via environment variables.

export const APP_URL = process.env['APP_URL'] ?? 'https://app.aiinsight.dev'
export const API_URL = process.env['API_URL'] ?? 'https://api.aiinsight.dev'
export const DOCS_URL = process.env['DOCS_URL'] ?? 'https://docs.aiinsight.dev'
export const SUPPORT_EMAIL = process.env['SUPPORT_EMAIL'] ?? 'support@aiinsight.dev'
export const STATUS_URL = process.env['STATUS_URL'] ?? 'https://status.aiinsight.dev'

// ── GitHub ─────────────────────────────────────────────────────────────

export const GITHUB_OWNER = process.env['GITHUB_OWNER'] ?? 'getagentseal'
export const GITHUB_REPO = process.env['GITHUB_REPO'] ?? 'codeburn'
export const GITHUB_RELEASES_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`

// ── Distribution ───────────────────────────────────────────────────────

export const DOWNLOAD_BASE_URL = process.env['DOWNLOAD_BASE_URL'] ?? `https://releases.${GITHUB_OWNER}.dev/${GITHUB_REPO}`
export const INSTALL_SCRIPT_URL = process.env['INSTALL_SCRIPT_URL'] ?? `${DOWNLOAD_BASE_URL}/install.sh`

// ── Ingestion ──────────────────────────────────────────────────────────

export const INGESTION_API_URL = process.env['INGESTION_API_URL'] ?? API_URL
