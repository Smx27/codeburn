import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import chalk from 'chalk'

const BOLD = chalk.bold
const GREEN = chalk.green
const CYAN = chalk.cyan
const DIM = chalk.dim
const YELLOW = chalk.yellow
const RED = chalk.red

interface ProviderInfo {
  name: string
  path: string
  detected: boolean
}

export async function runProviders(): Promise<void> {
  const providers = detectProviders()

  console.log('')
  console.log(`  ${BOLD.cyan('AIInsight')} ${DIM('Provider Discovery')}`)
  console.log('')

  const maxName = Math.max(...providers.map((p) => p.name.length))

  for (const provider of providers) {
    const icon = provider.detected ? GREEN('✓') : YELLOW('○')
    const status = provider.detected ? GREEN('Detected') : YELLOW('Not detected')
    const pathInfo = provider.detected ? DIM(provider.path) : ''

    console.log(`  ${icon} ${provider.name.padEnd(maxName + 1)} ${status} ${pathInfo}`)
  }

  const detectedCount = providers.filter((p) => p.detected).length
  console.log(`\n  ${DIM(`${detectedCount} provider(s) detected`)}\n`)
}

function detectProviders(): ProviderInfo[] {
  const home = homedir()

  const providers: ProviderInfo[] = [
    {
      name: 'Claude',
      path: join(home, '.claude'),
      detected: existsSync(join(home, '.claude')),
    },
    {
      name: 'Codex',
      path: join(home, '.codex'),
      detected: existsSync(join(home, '.codex')),
    },
    {
      name: 'Cursor',
      path: join(home, '.config', 'Cursor'),
      detected: existsSync(join(home, '.config', 'Cursor')),
    },
    {
      name: 'Gemini',
      path: join(home, '.gemini'),
      detected: existsSync(join(home, '.gemini')),
    },
    {
      name: 'Warp',
      path: join(home, '.warp'),
      detected: existsSync(join(home, '.warp')),
    },
    {
      name: 'OpenCode',
      path: join(home, '.local', 'share', 'opencode'),
      detected: existsSync(join(home, '.local', 'share', 'opencode')),
    },
    {
      name: 'Cline',
      path: join(home, '.cline'),
      detected: existsSync(join(home, '.cline')),
    },
    {
      name: 'Roo Code',
      path: join(home, '.roo'),
      detected: existsSync(join(home, '.roo')),
    },
    {
      name: 'Kilo Code',
      path: join(home, '.kilocode'),
      detected: existsSync(join(home, '.kilocode')),
    },
    {
      name: 'Copilot',
      path: join(home, '.copilot'),
      detected: existsSync(join(home, '.copilot')),
    },
    {
      name: 'Devin',
      path: join(home, '.devin'),
      detected: existsSync(join(home, '.devin')),
    },
    {
      name: 'Pi',
      path: join(home, '.pi'),
      detected: existsSync(join(home, '.pi')),
    },
    {
      name: 'OpenClaw',
      path: join(home, '.openclaw'),
      detected: existsSync(join(home, '.openclaw')),
    },
    {
      name: 'Qwen',
      path: join(home, '.qwen'),
      detected: existsSync(join(home, '.qwen')),
    },
    {
      name: 'Kimi',
      path: join(home, '.kimi'),
      detected: existsSync(join(home, '.kimi')),
    },
  ]

  return providers
}
