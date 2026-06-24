import figlet from 'figlet'
import chalk from 'chalk'
import { BUILD_VERSION } from '../build-info.js'

const version = BUILD_VERSION

const BORDER = chalk.hex('#4a5568')

export function renderBanner(): string {
  let ascii: string
  try {
    ascii = figlet.textSync('Niriksh', {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted',
    })
  } catch {
    try {
      ascii = figlet.textSync('Niriksh', {
        horizontalLayout: 'fitted',
      })
    } catch {
      ascii = '  Niriksh'
    }
  }

  const lines = ascii.split('\n')
  const maxLen = Math.max(...lines.map(l => l.length))
  const padded = lines.map(l => l.padEnd(maxLen))
  const bordered = padded.map(l => `${BORDER('│')} ${chalk.bold.cyan(l)} ${BORDER('│')}`)
  const top = `${BORDER('┌')}${BORDER('─'.repeat(maxLen + 2))}${BORDER('┐')}`
  const bottom = `${BORDER('└')}${BORDER('─'.repeat(maxLen + 2))}${BORDER('┘')}`

  const tagline = chalk.hex('#a0aec0')('AI Usage Intelligence Platform')
  const rawTaglineLen = 'AI Usage Intelligence Platform'.length
  const taglinePad = ' '.repeat(Math.max(0, Math.floor((maxLen + 4 - rawTaglineLen) / 2)))

  return [
    '',
    top,
    ...bordered,
    bottom,
    `${taglinePad}${tagline}`,
    '',
  ].join('\n')
}

export function renderFooter(): string {
  const nodeVersion = process.version
  const platform = `${process.platform}-${process.arch}`
  const env = process.env['NODE_ENV'] ?? 'development'

  const divider = BORDER('─'.repeat(48))

  return [
    '',
    divider,
    '',
    `  ${chalk.bold.cyan('Niriksh Agent')} ${chalk.dim(`v${version}`)}`,
    '',
    `  ${chalk.dim('Environment')} : ${env}`,
    `  ${dim('Platform')}    : ${platform}`,
    `  ${dim('Node.js')}     : ${nodeVersion}`,
    `  ${dim('Sync Engine')} : ${chalk.green('Enabled')}`,
    '',
    divider,
    '',
    chalk.hex('#718096')('  Built with ❤️  by Niriksh Labs'),
    '',
  ].join('\n')
}

function dim(label: string): string {
  return chalk.dim(label)
}

export function renderVersionBlock(): string {
  const platform = `${process.platform}-${process.arch}`
  const env = process.env['NODE_ENV'] ?? 'development'

  return [
    '',
    `  ${chalk.bold.cyan('Niriksh Agent')}`,
    '',
    `  ${dim('Version')}  : ${version}`,
    `  ${dim('Platform')} : ${platform}`,
    `  ${dim('Node.js')}  : ${process.version}`,
    `  ${dim('Env')}      : ${env}`,
    '',
  ].join('\n')
}
