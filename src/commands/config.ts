import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'
import { readConfig, saveConfig, getConfigFilePath, getSyncConfig } from '../config.js'
import { renderSuccess } from '../ui/success.js'
import { renderError } from '../ui/errors.js'

const BOLD = chalk.bold
const GREEN = chalk.green
const CYAN = chalk.cyan
const DIM = chalk.dim
const YELLOW = chalk.yellow

const execAsync = promisify(exec)

export async function runConfig(action?: string): Promise<void> {
  switch (action) {
    case 'edit':
      await openConfigInEditor()
      break
    case 'reset':
      await resetConfig()
      break
    default:
      await showConfig()
  }
}

async function showConfig(): Promise<void> {
  const syncConfig = await getSyncConfig()
  const config = await readConfig()

  console.log('')
  console.log(`  ${BOLD.cyan('AIInsight')} ${DIM('Configuration')}`)
  console.log('')

  if (!syncConfig.organizationId) {
    console.log(`  ${YELLOW('⚠')} Not connected to AIInsight Cloud.`)
    console.log(`    Run ${BOLD.cyan('aiinsight login')} to connect.\n`)
    return
  }

  const maxKey = 20
  const lines: [string, string][] = [
    ['Organization', syncConfig.organizationName || syncConfig.organizationId],
    ['Organization ID', syncConfig.organizationId],
    ['Machine ID', syncConfig.machineId],
    ['API URL', syncConfig.apiUrl || 'Not set'],
    ['Sync Interval', `${syncConfig.syncInterval}s (${Math.floor(syncConfig.syncInterval / 60)} min)`],
    ['Sync Enabled', syncConfig.enabled ? 'Yes' : 'No'],
    ['Config File', getConfigFilePath()],
  ]

  for (const [key, value] of lines) {
    console.log(`    ${DIM(key.padEnd(maxKey + 1))}: ${value}`)
  }

  // Show currency if set
  if (config.currency?.code) {
    console.log(`    ${DIM('Currency'.padEnd(maxKey + 1))}: ${config.currency.code}`)
  }

  // Show plan if set
  if (config.plans && Object.keys(config.plans).length > 0) {
    const providers = Object.keys(config.plans).join(', ')
    console.log(`    ${DIM('Plans'.padEnd(maxKey + 1))}: ${providers}`)
  }

  console.log('')
}

async function openConfigInEditor(): Promise<void> {
  const configPath = getConfigFilePath()
  const editor = process.env.EDITOR || 'vi'

  console.log(`\n  ${CYAN('▸')} Opening config in ${editor}...`)

  try {
    await execAsync(`${editor} ${configPath}`)
    console.log(`  ${GREEN('✓')} Config saved.\n`)
  } catch (error) {
    console.error(renderError(`Failed to open editor: ${(error as Error).message}`))
  }
}

async function resetConfig(): Promise<void> {
  const confirmed = await confirmAction(
    'This will clear all sync configuration and disconnect from AIInsight Cloud. Continue?'
  )

  if (!confirmed) {
    console.log(`\n  ${DIM('Cancelled.')}\n`)
    return
  }

  const config = await readConfig()
  delete config.sync
  await saveConfig(config)

  console.log(renderSuccess('Configuration Reset', {
    'Status': 'Sync configuration cleared',
    'Next Step': 'Run aiinsight login to reconnect',
  }))
}

function confirmAction(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question(`\n  ${YELLOW('⚠')} ${message} ${DIM('(y/n)')} `, (answer: string) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })

    rl.on('close', () => {
      resolve(false)
    })
  })
}
