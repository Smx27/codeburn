// ── Build Metadata ─────────────────────────────────────────────────────
// Injected at build time via tsup/esbuild define. These constants replace
// the previous createRequire(import.meta.url) + require('../package.json')
// pattern which breaks inside Node SEA blobs.

/* eslint-disable no-var */
declare global {
  var __BUILD_VERSION__: string
  var __BUILD_COMMIT__: string
  var __BUILD_DATE__: string
}

// @ts-ignore - replaced at build time by esbuild define
export const BUILD_VERSION: string = __BUILD_VERSION__
// @ts-ignore - replaced at build time by esbuild define
export const BUILD_COMMIT: string = __BUILD_COMMIT__
// @ts-ignore - replaced at build time by esbuild define
export const BUILD_DATE: string = __BUILD_DATE__
