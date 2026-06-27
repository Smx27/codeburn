// ── App URLs ───────────────────────────────────────────────────────────
// Centralized URL constants. All URLs in the codebase should reference
// these instead of hardcoding. Override via environment variables.

export const APP_URL = process.env['APP_URL'] ?? 'https://niriksh.titanbyte.in'
export const API_URL = process.env['API_URL'] ?? 'https://niriksh.titanbyte.in/api'
export const DOCS_URL = process.env['DOCS_URL'] ?? 'https://niriksh.titanbyte.in/docs'
export const SUPPORT_EMAIL = process.env['SUPPORT_EMAIL'] ?? 'support@niriksh.dev'
export const STATUS_URL = process.env['STATUS_URL'] ?? 'https://status.niriksh.dev'

// ── GitHub ─────────────────────────────────────────────────────────────

export const GITHUB_OWNER = process.env['GITHUB_OWNER'] ?? 'Smx27'
export const GITHUB_REPO = process.env['GITHUB_REPO'] ?? 'codeburn'
export const GITHUB_RELEASES_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`

// ── Distribution ───────────────────────────────────────────────────────

export const DOWNLOAD_BASE_URL = process.env['DOWNLOAD_BASE_URL'] ?? APP_URL
export const INSTALL_SCRIPT_URL = process.env['INSTALL_SCRIPT_URL'] ?? `${APP_URL}/install.sh`
export const INSTALL_SCRIPT_POWERSHELL_URL = process.env['INSTALL_SCRIPT_POWERSHELL_URL'] ?? `${APP_URL}/install.ps1`
export const DOWNLOADS_PAGE_URL = process.env['DOWNLOADS_PAGE_URL'] ?? `${APP_URL}/downloads`

// ── Release Artifacts ──────────────────────────────────────────────────
// Single source of truth for all release asset filenames.
// Every layer — build script, workflow, installer, download page, docs —
// must import from here. No hardcoded filenames elsewhere.

export const RELEASE_ARTIFACTS = {
  linuxX64: 'niriksh-linux-x64',
  linuxArm64: 'niriksh-linux-arm64',
  darwinX64: 'niriksh-darwin-x64',
  darwinArm64: 'niriksh-darwin-arm64',
  windowsX64: 'niriksh.exe',
  checksums: 'SHA256SUMS',
} as const

export type ReleaseArtifact = typeof RELEASE_ARTIFACTS[keyof typeof RELEASE_ARTIFACTS]

/** Map (platform, arch) → artifact filename */
export function artifactNameFor(platform: string, arch: string): string {
  if (platform === 'win32') return RELEASE_ARTIFACTS.windowsX64
  if (platform === 'linux' && arch === 'x64') return RELEASE_ARTIFACTS.linuxX64
  if (platform === 'linux' && arch === 'arm64') return RELEASE_ARTIFACTS.linuxArm64
  if (platform === 'darwin' && arch === 'x64') return RELEASE_ARTIFACTS.darwinX64
  if (platform === 'darwin' && arch === 'arm64') return RELEASE_ARTIFACTS.darwinArm64
  throw new Error(`Unsupported platform/arch combination: ${platform}-${arch}`)
}

/** All release asset filenames */
export const ALL_ARTIFACT_NAMES = Object.values(RELEASE_ARTIFACTS)

// ── Ingestion ──────────────────────────────────────────────────────────

export const INGESTION_API_URL = process.env['INGESTION_API_URL'] ?? API_URL
