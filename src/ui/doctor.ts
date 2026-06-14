import chalk from 'chalk'
import { readConfig, getConfigFilePath } from '../config.js'
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

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
}

async function checkConfig(): Promise<CheckResult> {
  try {
    const config = await readConfig()
    const path = getConfigFilePath()
    if (existsSync(path)) {
      return { name: 'Configuration', ok: true, message: path }
    }
    return { name: 'Configuration', ok: false, message: 'No config file found' }
  } catch {
    return { name: 'Configuration', ok: false, message: 'Failed to read config' }
  }
}

function checkEnrollment(): CheckResult {
  const configPath = getConfigFilePath()
  if (!existsSync(configPath)) {
    return { name: 'Enrollment', ok: false, message: 'Not enrolled' }
  }
  return { name: 'Enrollment', ok: true }
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
  ]

  const found = providerPaths.filter(p => existsSync(p))
  if (found.length === 0) {
    return { name: 'Provider Discovery', ok: false, message: 'No providers detected' }
  }
  return { name: 'Provider Discovery', ok: true, message: `${found.length} provider(s) found` }
}

function checkPermissions(): CheckResult {
  const configPath = getConfigFilePath()
  const dir = configPath.substring(0, configPath.lastIndexOf('/'))
  if (!existsSync(dir)) {
    return { name: 'Local Permissions', ok: false, message: `Cannot write to ${dir}` }
  }
  return { name: 'Local Permissions', ok: true }
}

export async function runDoctor(): Promise<string> {
  const checks: CheckResult[] = [
    await checkConfig(),
    checkEnrollment(),
    checkProviders(),
    checkPermissions(),
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
    if (!check.ok) hasError = true
  }

  lines.push('')

  if (hasError) {
    lines.push(`  ${YELLOW('Some checks failed. Run the commands below for more info:')}`)
    lines.push(`    aiinsight --verbose`)
    lines.push('')
  } else {
    lines.push(`  ${GREEN('All checks passed.')}`)
    lines.push('')
  }

  return lines.join('\n')
}
