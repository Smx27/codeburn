import chalk from 'chalk'
import type { ProjectSummary } from '../types.js'
import { getCurrency } from '../currency.js'
import { buildPeriodData } from '../usage-aggregator.js'

const BOLD = chalk.bold
const CYAN = chalk.cyan
const GREEN = chalk.green
const DIM = chalk.dim
const YELLOW = chalk.yellow
const RED = chalk.red

export function renderStatusHeader(): string {
  return [
    '',
    `  ${BOLD.cyan('AIInsight')} ${DIM('Status')}`,
    '',
  ].join('\n')
}

export function renderOrganizationInfo(orgName: string, machineId: string): string {
  return [
    `  ${BOLD('Organization')}`,
    `    ${orgName}`,
    '',
    `  ${BOLD('Machine')}`,
    `    ${machineId}`,
    '',
  ].join('\n')
}

export function renderAgentStatus(connected: boolean, lastSync?: string): string {
  const status = connected ? GREEN('Connected') : RED('Disconnected')
  const lines = [
    `  ${BOLD('Agent Status')}`,
    `    ${status}`,
    '',
  ]

  if (lastSync) {
    lines.push(`  ${BOLD('Last Sync')}`)
    lines.push(`    ${lastSync}`)
    lines.push('')
  }

  return lines.join('\n')
}

export function renderProviderList(providers: { name: string; active: boolean }[]): string {
  const lines = [
    `  ${BOLD('Providers')}`,
  ]

  for (const p of providers) {
    const icon = p.active ? GREEN('✓') : DIM('✗')
    lines.push(`    ${icon} ${p.name}`)
  }

  lines.push('')
  return lines.join('\n')
}

export function renderTerminalStatus(projects: ProjectSummary[]): string {
  const todayData = buildPeriodData('today', projects)
  const monthData = buildPeriodData('month', projects)
  const { symbol } = getCurrency()

  const todayCost = `${symbol}${todayData.cost.toFixed(2)}`
  const monthCost = `${symbol}${monthData.cost.toFixed(2)}`
  const todayCalls = todayData.calls.toLocaleString()
  const monthCalls = monthData.calls.toLocaleString()

  return [
    '',
    `  ${BOLD.cyan('AIInsight')} ${DIM('Status')}`,
    '',
    `  ${BOLD('Today')}`,
    `    Cost   : ${todayCost}`,
    `    Calls  : ${todayCalls}`,
    '',
    `  ${BOLD('This Month')}`,
    `    Cost   : ${monthCost}`,
    `    Calls  : ${monthCalls}`,
    '',
  ].join('\n')
}
