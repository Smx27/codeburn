import { join } from 'path'
import { homedir } from 'os'

// ── Config Directory ───────────────────────────────────────────────────
// Platform-safe config directory following OS conventions:
//   Windows:  %APPDATA%/Niriksh
//   macOS:    ~/Library/Application Support/Niriksh
//   Linux:    $XDG_CONFIG_HOME/niriksh (fallback ~/.config/niriksh)

export function getConfigDir(): string {
  if (process.platform === 'win32') {
    return join(process.env['APPDATA'] || join(homedir(), 'AppData', 'Roaming'), 'Niriksh')
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'Niriksh')
  }
  return join(process.env['XDG_CONFIG_HOME'] || join(homedir(), '.config'), 'niriksh')
}

// ── Cache Directory ────────────────────────────────────────────────────
// Platform-safe cache directory following OS conventions:
//   Windows:  %LOCALAPPDATA%/Niriksh/cache
//   macOS:    ~/Library/Caches/Niriksh
//   Linux:    $XDG_CACHE_HOME/niriksh (fallback ~/.cache/niriksh)

export function getCacheDir(): string {
  if (process.env['NIRIKSH_CACHE_DIR']) {
    return process.env['NIRIKSH_CACHE_DIR']
  }
  if (process.env['AIINSIGHT_CACHE_DIR']) {
    return process.env['AIINSIGHT_CACHE_DIR']
  }
  if (process.env['CODEBURN_CACHE_DIR']) {
    return process.env['CODEBURN_CACHE_DIR']
  }
  if (process.platform === 'win32') {
    return join(process.env['LOCALAPPDATA'] || join(homedir(), 'AppData', 'Local'), 'Niriksh', 'cache')
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Caches', 'Niriksh')
  }
  return join(process.env['XDG_CACHE_HOME'] || join(homedir(), '.cache'), 'niriksh')
}

// ── Config Paths ───────────────────────────────────────────────────────

export function getConfigPath(): string {
  return join(getConfigDir(), 'config.json')
}

export function getMachineIdPath(): string {
  return join(getConfigDir(), 'machine-id')
}

export function getSyncStatePath(): string {
  return join(getConfigDir(), 'sync-state')
}

export function getUploadQueuePath(): string {
  return join(getConfigDir(), 'upload-queue')
}

export function getLogsDir(): string {
  return join(getConfigDir(), 'logs')
}
