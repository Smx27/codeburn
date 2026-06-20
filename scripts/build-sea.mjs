#!/usr/bin/env node
// scripts/build-sea.mjs — Build Node.js Single Executable Application
// Usage: node scripts/build-sea.mjs [--platform <os>]
// If --platform is omitted, builds for the current platform.

import { execSync } from 'child_process'
import { existsSync, mkdirSync, copyFileSync, chmodSync, rmSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Parse --platform flag
const platformArg = process.argv.indexOf('--platform')
const targetPlatform = platformArg !== -1 ? process.argv[platformArg + 1] : process.platform

const PLATFORM_MAP = {
  win32: 'win32',
  linux: 'linux',
  darwin: 'darwin',
}

const platform = PLATFORM_MAP[targetPlatform] || process.platform
const arch = process.arch

console.log(`Building SEA for ${platform}-${arch}...`)

const distDir = join(ROOT, 'dist')

// Step 1: Build the ESM bundle (all dependencies included)
const mainJsPath = join(distDir, 'main.js')
console.log('Building ESM bundle...')
execSync('npx tsup --config tsup.sea.config.ts', { cwd: ROOT, stdio: 'inherit' })

const mainJsSize = readFileSync(mainJsPath).length
console.log(`  Bundle size: ${(mainJsSize / 1024 / 1024).toFixed(1)} MB`)

// Step 2: Post-process ESM → CJS-compatible for SEA
// Node SEA runs blobs in CJS context (embedderRunCjs), so we need to:
// 1. Replace the ESM import banner with CJS require
// 2. Convert all `import X from "Y"` → `const X = require("Y")`
// 3. Convert all `import { X } from "Y"` → `const { X } = require("Y")`
// 4. Replace import.meta.url with CJS equivalent
// 5. Remove export statements
console.log('Converting ESM bundle to CJS-compatible format for SEA...')
let code = readFileSync(mainJsPath, 'utf-8')

// Remove the ESM banner (createRequire from node:module)
code = code.replace(
  /import \{ createRequire as __nodeCreateRequire \} from 'node:module';\nconst require = __nodeCreateRequire\(import\.meta\.url\);\nglobalThis\.require = require;\n/,
  ''
)

// Convert `import X from "module"` to `const X = require("module")`
// Handle both single and multi-word default imports
code = code.replace(
  /^import\s+(\w+)\s+from\s+["']([^"']+)["'];\s*$/gm,
  'const $1 = require("$2");'
)

// Convert `import { X, Y as Z } from "module"` to `const { X, Y: Z } = require("module")`
// Note: ESM uses `as` for renaming, CJS uses `:` in destructuring
code = code.replace(
  /^import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];\s*$/gm,
  (_, imports, mod) => {
    // Convert `as` to `:` for destructuring rename
    const cjsImports = imports.replace(/(\w+)\s+as\s+(\w+)/g, '$1: $2')
    return `const {${cjsImports}} = require("${mod}");`
  }
)

// Convert `import * as X from "module"` to `const X = require("module")`
code = code.replace(
  /^import\s+\*\s+as\s+(\w+)\s+from\s+["']([^"']+)["'];\s*$/gm,
  'const $1 = require("$2");'
)

// Handle `import type { ... }` (TypeScript type imports — should have been stripped, but just in case)
code = code.replace(
  /^import\s+type\s+\{[^}]+\}\s+from\s+["'][^"']+["'];\s*$/gm,
  ''
)

// Replace import.meta.url with CJS equivalent
// In CJS, __filename gives us the file path, and we can convert to file:// URL
code = code.replace(
  /import\.meta\.url/g,
  '(typeof __filename !== "undefined" ? require("url").pathToFileURL(__filename).href : "")'
)

// Replace import.meta.resolve("X") — used in react-devtools
code = code.replace(
  /import\.meta\.resolve\(([^)]+)\)/g,
  'require.resolve($1)'
)

// Remove any remaining export statements (re-exports, etc.)
code = code.replace(
  /^export\s+(?:default\s+|const\s+|function\s+|class\s+|{[^}]+}\s+from\s+).*/gm,
  '// [SEA] export removed'
)

// Wrap the entire bundle in an async IIFE so top-level await works in CJS context.
// SEA runs blobs via embedderRunCjs (CJS), but our ESM-sourced bundle may contain
// top-level await (e.g. from yoga-layout). Wrapping in (async () => { ... })()
// makes this valid CJS.
const seaEntryPath = join(distDir, 'sea-entry.cjs')
const wrappedCode = `(async () => {\n${code}\n})();`
writeFileSync(seaEntryPath, wrappedCode, 'utf-8')
chmodSync(seaEntryPath, 0o755)
const cjsSize = readFileSync(seaEntryPath).length
console.log(`  CJS-compatible size: ${(cjsSize / 1024 / 1024).toFixed(1)} MB`)

// Quick validation: ensure no ESM syntax remains
const importCount = (code.match(/^import\s/gm) || []).length
const exportCount = (code.match(/^export\s/gm) || []).length
const importMetaCount = (code.match(/import\.meta/g) || []).length
if (importCount > 0 || exportCount > 0) {
  console.warn(`  WARNING: ${importCount} import(s) and ${exportCount} export(s) still remain`)
}
if (importMetaCount > 0) {
  console.warn(`  WARNING: ${importMetaCount} import.meta reference(s) still remain`)
}

// Step 3: Create SEA blob from the CJS-compatible entry
console.log('Creating SEA blob...')
const seaConfigPath = join(ROOT, 'sea-config.json')
const seaConfig = {
  main: 'dist/sea-entry.cjs',
  output: 'dist/sea-prep.blob',
  disableExperimentalSEAWarning: true,
}
writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2) + '\n', 'utf-8')

// Remove old blob to force regeneration
const blobPath = join(distDir, 'sea-prep.blob')
if (existsSync(blobPath)) rmSync(blobPath)

execSync('node --experimental-sea-config sea-config.json', { cwd: ROOT, stdio: 'inherit' })

const blobSize = readFileSync(blobPath).length
console.log(`  Blob size: ${(blobSize / 1024 / 1024).toFixed(1)} MB`)

if (blobSize < 100000) {
  console.error(`ERROR: Blob is only ${blobSize} bytes. Expected >100KB. The bundle was not embedded.`)
  process.exit(1)
}

// Step 4: Copy the node binary
const isWindows = platform === 'win32'
const nodeBinary = isWindows ? 'node.exe' : 'node'
const seaBinary = isWindows ? 'aiinsight.exe' : `aiinsight-${platform}-${arch}`
const seaBinPath = join(distDir, seaBinary)

const nodePath = execSync('which node', { encoding: 'utf-8' }).trim()
console.log(`Copying node binary from ${nodePath}...`)
copyFileSync(nodePath, seaBinPath)
chmodSync(seaBinPath, 0o755)

// Step 5: Inject the blob using postject
console.log('Injecting SEA blob...')
try {
  execSync(
    `npx postject ${seaBinPath} NODE_SEA_BLOB ${blobPath} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
    { cwd: ROOT, stdio: 'inherit' }
  )
} catch (err) {
  console.error('postject failed. Ensure postject is installed: npm install -g postject')
  process.exit(1)
}

// Step 6: macOS code signing (ad-hoc)
if (platform === 'darwin') {
  console.log('Signing macOS binary (ad-hoc)...')
  try {
    execSync(`codesign --sign - ${seaBinPath}`, { stdio: 'inherit' })
  } catch {
    console.warn('Warning: codesign failed. Binary may not run on macOS without signing.')
  }
}

// Step 7: Clean up intermediate files
console.log('Cleaning up...')
const filesToRemove = [join(distDir, 'main.js.map')]
for (const f of filesToRemove) {
  if (existsSync(f)) {
    rmSync(f)
    console.log(`  Removed: ${f}`)
  }
}

// Step 8: Generate SHA256SUMS
console.log('Generating SHA256SUMS...')
const content = readFileSync(seaBinPath)
const hash = createHash('sha256').update(content).digest('hex')
const sumsContent = `${hash}  ${seaBinary}\n`
writeFileSync(join(distDir, 'SHA256SUMS'), sumsContent)

console.log(`\nBuild complete:`)
console.log(`  Binary: ${seaBinPath}`)
console.log(`  SHA256: ${hash}`)
console.log(`  Size:   ${(content.length / 1024 / 1024).toFixed(1)} MB`)
console.log(`  Blob:   ${(blobSize / 1024 / 1024).toFixed(1)} MB (embedded)`)
console.log(`\n  The binary is self-contained. No external files needed.`)
