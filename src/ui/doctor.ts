import chalk from 'chalk'
import { readConfig, getConfigFilePath, getSyncConfig } from '../config.js'
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { platform } from 'os'
import { fetchWithTimeout } from '../fetch-utils.js'

const BOLD = chalk.bold
const CYAN = chalk.cyan
const GREEN = chalk.green
const RED = chalk.red
const YELLOW = chalk.yellow
const DIM = chalk.dim

interface CheckResult {
  name: string
  ok: boolean
  message?: string
  recommendation?: string
}

async function checkConfig(): Promise<CheckResult> {
  try {
    const path = getConfigFilePath()
    if (existsSync(path)) {
      const config = await readConfig()
      if (config.sync?.organizationId) {
        return { name: 'Configuration', ok: true, message: `${path} (connected)` }
      }
      return { name: 'Configuration', ok: true, message: `${path} (not connected)` }
    }
    return { name: 'Configuration', ok: false, message: 'No config file found', recommendation: 'Run niriksh login to connect' }
  } catch {
    return { name: 'Configuration', ok: false, message: 'Failed to read config' }
  }
}

async function checkSyncConfig(): Promise<CheckResult> {
  const syncConfig = await getSyncConfig()
  if (!syncConfig.organizationId) {
    return { name: 'Sync Configuration', ok: false, message: 'Not connected to Niriksh Cloud', recommendation: 'Run niriksh login' }
  }
  if (!syncConfig.apiKey && !syncConfig.agentToken) {
    return { name: 'Sync Configuration', ok: false, message: 'No API key or agent token', recommendation: 'Run niriksh login' }
  }
  return { name: 'Sync Configuration', ok: true, message: `Org: ${syncConfig.organizationName || syncConfig.organizationId}` }
}

async function checkNetwork(): Promise<CheckResult> {
  try {
    const response = await fetchWithTimeout('https://httpbin.org/get', { method: 'HEAD' }, 5000)
    if (response.ok) {
      return { name: 'Network', ok: true, message: 'Internet connection available' }
    }
    return { name: 'Network', ok: false, message: 'Network request failed' }
  } catch {
    return { name: 'Network', ok: false, message: 'No internet connection', recommendation: 'Check your network settings' }
  }
}

async function checkApiConnectivity(): Promise<CheckResult> {
  const syncConfig = await getSyncConfig()
  if (!syncConfig.apiUrl) {
    return { name: 'API Connectivity', ok: false, message: 'No API URL configured', recommendation: 'Run niriksh login' }
  }

  try {
    const response = await fetchWithTimeout(`${syncConfig.apiUrl}/api/v1/health`, {}, 5000)
    if (response.ok) {
      return { name: 'API Connectivity', ok: true, message: `${syncConfig.apiUrl} reachable` }
    }
    return { name: 'API Connectivity', ok: false, message: `API returned ${response.status}` }
  } catch {
    return { name: 'API Connectivity', ok: false, message: 'Cannot reach API', recommendation: `Check if ${syncConfig.apiUrl} is accessible` }
  }
}

async function checkApiKeyValidity(): Promise<CheckResult> {
  const syncConfig = await getSyncConfig()
  if (!syncConfig.apiKey && !syncConfig.agentToken) {
    return { name: 'API Key', ok: false, message: 'No API key configured', recommendation: 'Run niriksh login' }
  }
  return { name: 'API Key', ok: true, message: 'Key configured' }
}

function checkProviders(): CheckResult {
  const providerPaths = [
    join(homedir(), '.claude'),
    join(homedir(), '.codex'),
    join(homedir(), '.gemini'),
    join(homedir(), '.config', 'Cursor'),
    join(homedir(), '.config', 'manicode'),
    join(homedir(), '.vibe'),
    join(homedir(), '.pi'),
    join(homedir(), '.omp'),
    join(homedir(), '.openclaw'),
    join(homedir(), '.factory'),
    join(homedir(), '.qwen'),
    join(homedir(), '.kimi'),
    join(homedir(), '.cline'),
    join(homedir(), '.warp'),
    join(homedir(), '.local', 'share', 'opencode'),
  ]

  const found = providerPaths.filter(p => existsSync(p))
  if (found.length === 0) {
    return { name: 'Provider Discovery', ok: false, message: 'No providers detected', recommendation: 'Install an AI coding tool (Claude, Codex, Cursor, etc.)' }
  }
  return { name: 'Provider Discovery', ok: true, message: `${found.length} provider(s) found` }
}

function checkPermissions(): CheckResult {
  const configPath = getConfigFilePath()
  const dir = configPath.substring(0, configPath.lastIndexOf('/'))
  if (!existsSync(dir)) {
    return { name: 'Local Permissions', ok: false, message: `Cannot write to ${dir}`, recommendation: 'Check directory permissions' }
  }
  return { name: 'Local Permissions', ok: true }
}

function checkNodeVersion(): CheckResult {
  const version = process.version
  const major = parseInt(version.slice(1).split('.')[0], 10)
  if (major < 22) {
    return { name: 'Node Version', ok: false, message: `${version} (requires 22+)`, recommendation: 'Upgrade to Node.js 22 or later' }
  }
  return { name: 'Node Version', ok: true, message: version }
}

function checkOS(): CheckResult {
  const os = platform()
  const supported = ['darwin', 'linux', 'win32']
  if (supported.includes(os)) {
    return { name: 'OS Support', ok: true, message: os }
  }
  return { name: 'OS Support', ok: false, message: `${os} (not officially supported)` }
}

export async function runDoctor(): Promise<string> {
  const checks: CheckResult[] = [
    await checkConfig(),
    await checkSyncConfig(),
    await checkNetwork(),
    await checkApiConnectivity(),
    await checkApiKeyValidity(),
    checkProviders(),
    checkPermissions(),
    checkNodeVersion(),
    checkOS(),
  ]

  const lines: string[] = [
    '',
    `  ${BOLD.cyan('AIInsight')} ${DIM('Doctor')}`,
    '',
  ]

  let hasError = false
  for (const check of checks) {
    const icon = check.ok ? GREEN('✓') : RED('✗')
    const status = check.ok ? GREEN('OK') : RED('FAIL')
    lines.push(`  ${icon} ${check.name} ${DIM(status)}`)
    if (check.message) {
      lines.push(`    ${DIM(check.message)}`)
    }
    if (check.recommendation) {
      lines.push(`    ${YELLOW('→')} ${check.recommendation}`)
    }
    if (!check.ok) hasError = true
  }

  lines.push('')

  if (hasError) {
    lines.push(`  ${YELLOW('Some checks failed. Follow the recommendations above.')}`)
    lines.push('')
  } else {
    lines.push(`  ${GREEN('All checks passed.')}`)
    lines.push('')
  }

  return lines.join('\n')
}
