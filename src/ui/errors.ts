import chalk from 'chalk'

const BOLD = chalk.bold
const RED = chalk.red
const YELLOW = chalk.yellow
const DIM = chalk.dim

export function renderError(message: string): string {
  return `\n  ${RED('✗')} ${BOLD.red('Error')}: ${message}\n`
}

export function renderWarning(message: string): string {
  return `  ${YELLOW('⚠')} ${message}`
}

export function renderValidationError(field: string, message: string): string {
  return `\n  ${RED('✗')} ${field}: ${message}\n`
}

export function renderMissingConfig(key: string): string {
  return renderError(`${key} is required. Set with --${key.toLowerCase().replace(/_/g, '-')} or configure via niriksh config.`)
}

export function renderSyncError(message: string): string {
  return `\n  ${RED('✗')} ${BOLD.red('Sync failed')}: ${message}\n`
}
