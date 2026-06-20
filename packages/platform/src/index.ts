import { join } from 'path'
import { homedir } from 'os'

// ── Config Directory ───────────────────────────────────────────────────
// Platform-safe config directory following OS conventions:
//   Windows:  %APPDATA%/AIInsight
//   macOS:    ~/Library/Application Support/AIInsight
//   Linux:    $XDG_CONFIG_HOME/aiinsight (fallback ~/.config/aiinsight)

export function getConfigDir(): string {
  if (process.platform === 'win32') {
    return join(process.env['APPDATA'] || join(homedir(), 'AppData', 'Roaming'), 'AIInsight')
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'AIInsight')
  }
  return join(process.env['XDG_CONFIG_HOME'] || join(homedir(), '.config'), 'aiinsight')
}

// ── Cache Directory ────────────────────────────────────────────────────
// Platform-safe cache directory following OS conventions:
//   Windows:  %LOCALAPPDATA%/AIInsight/cache
//   macOS:    ~/Library/Caches/AIInsight
//   Linux:    $XDG_CACHE_HOME/aiinsight (fallback ~/.cache/aiinsight)

export function getCacheDir(): string {
  if (process.env['AIINSIGHT_CACHE_DIR']) {
    return process.env['AIINSIGHT_CACHE_DIR']
  }
  if (process.platform === 'win32') {
    return join(process.env['LOCALAPPDATA'] || join(homedir(), 'AppData', 'Local'), 'AIInsight', 'cache')
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Caches', 'AIInsight')
  }
  return join(process.env['XDG_CACHE_HOME'] || join(homedir(), '.cache'), 'aiinsight')
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
