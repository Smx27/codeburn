import chalk from 'chalk'

const BOLD = chalk.bold
const GREEN = chalk.green
const CYAN = chalk.cyan
const DIM = chalk.dim

export function renderSuccess(title: string, details: Record<string, string>): string {
  const lines: string[] = [
    '',
    `  ${GREEN('✓')} ${BOLD.green(title)}`,
    '',
  ]

  const maxKey = Math.max(...Object.keys(details).map(k => k.length))
  for (const [key, value] of Object.entries(details)) {
    lines.push(`    ${DIM(key.padEnd(maxKey + 1))}: ${value}`)
  }

  lines.push('')
  return lines.join('\n')
}

export function renderOrganizationConnected(orgName: string, machineId: string, agentId: string): string {
  return renderSuccess('Organization Connected', {
    'Organization': orgName,
    'Machine': machineId,
    'Agent ID': agentId,
  }) + '  Historical sync will begin automatically.\n'
}

export function renderSyncComplete(result: {
  providersProcessed: number
  sessionsSynced: number
  eventsSynced: number
  errors?: string[]
}): string {
  const lines: string[] = [
    '',
    `  ${GREEN('✓')} ${BOLD.green('Sync Complete')}`,
    '',
    `    Providers processed : ${result.providersProcessed}`,
    `    Sessions synced     : ${result.sessionsSynced}`,
    `    Events synced       : ${result.eventsSynced}`,
  ]

  if (result.errors && result.errors.length > 0) {
    lines.push(`    ${chalk.yellow('Errors')}           : ${result.errors.length}`)
    for (const err of result.errors) {
      lines.push(`      ${chalk.dim('-')} ${err}`)
    }
  }

  lines.push('')
  return lines.join('\n')
}

export function renderProviderDiscovering(name: string): string {
  return `  ${CYAN('▸')} [${name}] Discovering conversations...`
}

export function renderProviderFound(name: string, count: number): string {
  return `  ${GREEN('✓')} [${name}] Found ${chalk.bold(count.toLocaleString())} sessions`
}

export function renderPreparingImport(): string {
  return `\n  ${CYAN('▸')} Preparing historical import...\n`
}

export function renderWelcome(): string {
  return [
    '',
    `  ${BOLD.cyan('Welcome to AIInsight')}`,
    '',
    `  ${DIM('AI Usage Intelligence for Teams & Organizations')}`,
    '',
    `  Let's connect this machine to your organization.`,
    '',
    `  ${DIM('Paste your enrollment key:')}`,
    '',
  ].join('\n')
}
