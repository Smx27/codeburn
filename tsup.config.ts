import { defineConfig } from 'tsup'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const gitCommit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
})()

const buildDate = new Date().toISOString()

const pkg = (() => {
  try {
    return JSON.parse(readFileSync('package.json', 'utf-8')).version
  } catch {
    return '0.0.0-dev'
  }
})()

console.log(`[tsup] Build version: ${pkg}, commit: ${gitCommit}`)

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false,
  noExternal: [/@aiinsight\//],
  define: {
    __BUILD_VERSION__: JSON.stringify(pkg),
    __BUILD_COMMIT__: JSON.stringify(gitCommit),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
})
