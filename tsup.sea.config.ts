import { defineConfig } from 'tsup'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

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

console.log(`[tsup SEA] Build version: ${pkg}, commit: ${gitCommit}`)

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: false,
  splitting: false,
  sourcemap: false,
  dts: false,
  noExternal: [/.*/],
  define: {
    __BUILD_VERSION__: JSON.stringify(pkg),
    __BUILD_COMMIT__: JSON.stringify(gitCommit),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  banner: {
    js: `import { createRequire as __nodeCreateRequire } from 'node:module';
const require = __nodeCreateRequire(import.meta.url);
globalThis.require = require;`,
  },
  esbuildOptions(options) {
    options.conditions = ['node', 'import', 'default']
    options.mainFields = ['module', 'main']
  },
  onSuccess: undefined,
})
