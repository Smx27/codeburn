#!/usr/bin/env node
// AIInsight Installer Script (Node.js)
// Cross-platform installer that downloads the correct binary for the current OS.
// Usage: node scripts/install.mjs
//
// Environment variables:
//   AIINSIGHT_VERSION     — Pin a specific version (default: latest)
//   AIINSIGHT_INSTALL_DIR — Override install directory
//   DOWNLOAD_BASE_URL     — Override the download base URL

import { execSync } from 'child_process'
import { existsSync, mkdirSync, chmodSync, renameSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { createHash } from 'crypto'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DOWNLOAD_BASE = process.env['DOWNLOAD_BASE_URL'] ?? 'https://releases.getagentseal.dev/codeburn'
const INSTALL_DIR = process.env['AIINSIGHT_INSTALL_DIR'] ?? (process.platform === 'win32'
  ? join(process.env['LOCALAPPDATA'] ?? join(process.env['HOME'] ?? '~', 'AppData', 'Local'), 'AIInsight', 'bin')
  : '/usr/local/bin')
const VERSION = process.env['AIINSIGHT_VERSION'] ?? 'latest'

function getPlatform() {
  const os = process.platform
  const arch = process.arch

  if (os === 'win32') return { os: 'win32', arch, binary: 'aiinsight.exe' }
  if (os === 'darwin') return { os: 'darwin', arch, binary: `aiinsight-darwin-${arch}` }
  if (os === 'linux') return { os: 'linux', arch, binary: `aiinsight-linux-${arch}` }

  throw new Error(`Unsupported platform: ${os}-${arch}`)
}

async function getLatestVersion() {
  const url = 'https://api.github.com/repos/getagentseal/codeburn/releases/latest'
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch latest version: ${response.status}`)
  const data = await response.json()
  return data.tag_name
}

async function downloadFile(url, destPath) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`)

  const fileStream = createWriteStream(destPath)
  await pipeline(Readable.fromWeb(response.body), fileStream)
}

async function verifyChecksum(filePath, sumsUrl) {
  try {
    const response = await fetch(sumsUrl)
    if (!response.ok) return false

    const sumsText = await response.text()
    const expectedHash = sumsText.split(/\s+/)[0]

    const content = readFileSync(filePath)
    const actualHash = createHash('sha256').update(content).digest('hex')

    return expectedHash === actualHash
  } catch {
    return false
  }
}

async function main() {
  const { os, arch, binary } = getPlatform()
  console.log(`Detected platform: ${os}-${arch}`)

  const version = VERSION === 'latest' ? await getLatestVersion() : VERSION
  console.log(`Installing AIInsight ${version}...`)

  const url = `${DOWNLOAD_BASE}/${version}/${binary}`
  const sumsUrl = `${DOWNLOAD_BASE}/${version}/SHA256SUMS`
  const tmpPath = join(INSTALL_DIR, `.aiinsight-install-${Date.now()}`)

  try {
    // Ensure install directory exists
    mkdirSync(INSTALL_DIR, { recursive: true })

    // Download
    console.log(`Downloading from: ${url}`)
    await downloadFile(url, tmpPath)

    // Verify checksum
    console.log('Verifying checksum...')
    const checksumValid = await verifyChecksum(tmpPath, sumsUrl)
    if (!checksumValid) {
      console.warn('Warning: Checksum verification failed or unavailable. Continuing installation.')
    } else {
      console.log('Checksum verified.')
    }

    // Install
    const finalPath = join(INSTALL_DIR, binary)
    renameSync(tmpPath, finalPath)
    chmodSync(finalPath, 0o755)

    console.log(`\nAIInsight installed successfully to ${finalPath}`)
    console.log('\nQuick start:')
    console.log('  aiinsight login')
    console.log('  aiinsight sync')
  } catch (err) {
    if (existsSync(tmpPath)) unlinkSync(tmpPath)
    console.error(`Installation failed: ${err.message}`)
    process.exit(1)
  }
}

main()
