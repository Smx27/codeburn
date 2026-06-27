import { createInterface } from 'readline'
import { homedir } from 'os'
import { platform } from 'os'
import { arch } from 'os'
import chalk from 'chalk'
import { saveSyncConfig, getOrCreateMachineId } from '../config.js'
import { fetchWithTimeout } from '../fetch-utils.js'
import { renderSuccess, renderWelcome } from '../ui/success.js'
import { renderError } from '../ui/errors.js'

const BOLD = chalk.bold
const GREEN = chalk.green
const CYAN = chalk.cyan
const DIM = chalk.dim

interface AgentLoginResponse {
  organizationId: string
  organizationName: string
  machineId: string
  apiUrl: string
  syncInterval: number
  agentToken: string
}

export async function runLogin(apiUrl?: string): Promise<void> {
  console.log(renderWelcome())

  // Prompt for API key
  const apiKey = await promptForApiKey()
  if (!apiKey) {
    console.error(renderError('API key is required'))
    process.exit(1)
  }

  // Get system info
  const hostname = homedir().split('/').pop() || 'unknown'
  const os = platform()
  const architecture = arch()

  // Determine API URL
  const baseUrl = apiUrl || 'https://dapi.titanbyte.in'

  console.log(`\n  ${CYAN('▸')} Connecting to Niriksh Cloud at ${DIM(baseUrl)}...`)

  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/v1/agents/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        hostname,
        os,
        architecture,
        agentVersion: '1.0.0',
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error(renderError(error.error || 'Login failed'))
      process.exit(1)
    }

    const data: AgentLoginResponse = await response.json()

    // Save config
    await saveSyncConfig({
      organizationId: data.organizationId,
      organizationName: data.organizationName,
      machineId: data.machineId,
      dashboardApiUrl: baseUrl,
      apiUrl: data.apiUrl,
      apiKey,
      agentToken: data.agentToken,
      syncInterval: data.syncInterval,
      enabled: true,
    })

    // Also save machine ID to the separate file
    const machineIdPath = await getOrCreateMachineId()

    console.log(renderSuccess('Connected to Niriksh Cloud', {
      'Organization': data.organizationName,
      'Machine ID': data.machineId,
      'API URL': data.apiUrl,
      'Sync Interval': `${data.syncInterval} seconds`,
    }))

    console.log(`  ${DIM('Run')} ${BOLD.cyan('niriksh sync')} ${DIM('to start syncing.')}\n`)
  } catch (error) {
    if ((error as Error).name === 'TimeoutError') {
      console.error(renderError(`Connection timed out after 8s. URL: ${baseUrl}/api/v1/agents/login`))
    } else {
      const cause = (error as any).cause?.message || ''
      console.error(renderError(`Failed to connect to ${baseUrl}: ${(error as Error).message}${cause ? ` (${cause})` : ''}`))
    }
    process.exit(1)
  }
}

function promptForApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    let resolved = false
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question(`  ${DIM('Paste your API key:')} `, (answer) => {
      if (resolved) return
      resolved = true
      rl.close()
      resolve(answer.trim() || null)
    })

    rl.on('close', () => {
      if (resolved) return
      resolved = true
      resolve(null)
    })
  })
}
