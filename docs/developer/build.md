# Build

Build process for AIInsight.

## Overview

AIInsight uses tsup for bundling and TypeScript for compilation.

## Building the CLI

```bash
# Full build
npm run build

# This runs:
# 1. Bundle litellm pricing snapshot
# 2. Run tsup to produce dist/cli.js
```

## Building Cloud Services

### Individual Services

```bash
# Ingestion API
npm run api:build

# Dashboard API
npm run dashboard-api:build

# Dashboard Web
npm run dashboard-web:build
```

### All Services

```bash
npm run sync:build
npm run analytics:build
npm run api:build
npm run dashboard-api:build
npm run dashboard-web:build
```

## Build Output

```
dist/
├── cli.js                    # CLI entry point
├── cli.js.map               # Source map
└── ...                       # Other build artifacts
```

## Build Configuration

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node22',
  splitting: false,
  sourcemap: true,
  clean: true,
})
```

### package.json Scripts

```json
{
  "scripts": {
    "build": "npm run bundle-litellm && tsup",
    "bundle-litellm": "npx tsx scripts/build/bundle-litellm.ts",
    "prepublishOnly": "npm run build"
  }
}
```

## Development Build

For development, use `tsx` directly:

```bash
# Run CLI in dev mode
npm run dev -- status

# Run specific command
npm run dev -- report --period today
```

## Production Build

For production:

```bash
# Build
npm run build

# Test the build
node dist/cli.js --version

# Publish
npm publish
```

## Troubleshooting

### Build Fails

1. Check Node.js version (22+)
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npx tsc --noEmit`

### tsup Errors

1. Check `tsup.config.ts` syntax
2. Ensure all imports resolve correctly
3. Check for circular dependencies

## Related Documentation

- [Setup](setup.md) — Local development setup
- [Release Process](release-process.md) — How to release
- [Repository Structure](repository-structure.md) — Package details
