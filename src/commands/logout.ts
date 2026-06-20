import { createInterface } from 'readline'
import { rm } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import chalk from 'chalk'
import { readConfig, saveConfig, getConfigFilePath } from '../config.js'
import { renderSuccess } from '../ui/success.js'
import { renderError } from '../ui/errors.js'

const BOLD = chalk.bold
const GREEN = chalk.green
const YELLOW = chalk.yellow
const DIM = chalk.dim
const RED = chalk.red

export async function runLogout(force?: boolean): Promise<void> {
  const config = await readConfig()

  if (!config.sync?.organizationId) {
    console.log(`\n  ${YELLOW('⚠')} Not currently connected to any organization.\n`)
    return
  }

  const orgName = config.sync.organizationName || config.sync.organizationId

  if (!force) {
    const confirmed = await confirmAction(
      `This will disconnect from ${BOLD.cyan(orgName)} and clear all sync data. Continue?`
    )
    if (!confirmed) {
      console.log(`\n  ${DIM('Cancelled.')}\n`)
      return
    }
  }

  // Clear sync config
  delete config.sync
  await saveConfig(config)

  // Remove machine-id file
  const machineIdPath = join(homedir(), '.config', 'aiinsight', 'machine-id')
  if (existsSync(machineIdPath)) {
    await rm(machineIdPath).catch(() => {})
  }

  // Remove sync state directory
  const syncStateDir = join(homedir(), '.config', 'aiinsight', 'sync-state')
  if (existsSync(syncStateDir)) {
    await rm(syncStateDir, { recursive: true }).catch(() => {})
  }

  // Remove upload queue directory
  const uploadQueueDir = join(homedir(), '.config', 'aiinsight', 'upload-queue')
  if (existsSync(uploadQueueDir)) {
    await rm(uploadQueueDir, { recursive: true }).catch(() => {})
  }

  console.log(renderSuccess('Disconnected from AIInsight Cloud', {
    'Organization': orgName,
    'Status': 'All sync data cleared',
  }))
}

function confirmAction(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question(`\n  ${YELLOW('⚠')} ${message} ${DIM('(y/n)')} `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })

    rl.on('close', () => {
      resolve(false)
    })
  })
}
