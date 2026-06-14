# Coding Conventions

**Analysis Date:** 2026-06-12

## Naming Patterns

**Files:**
- kebab-case for all source files: `session-cache.ts`, `fs-utils.ts`, `provider-registry.ts`
- Provider files match their provider name: `claude.ts`, `cursor.ts`, `opencode.ts`
- Test files mirror source with `.test.ts` suffix: `classifier.test.ts` → `src/classifier.ts`
- Provider tests in `tests/providers/` subdirectory: `tests/providers/cursor.test.ts`

**Functions:**
- camelCase: `parseAllSessions`, `getModelCosts`, `classifyTurn`
- Boolean helpers use `has`/`is`/`should` prefix: `hasEditTools()`, `isCoworkSession()`, `shouldSkipHead()`
- Factory functions use `make` prefix: `makeCall()`, `makeTurn()`, `makeCachedFile()`
- Async functions clearly indicate async: `getAllProviders()`, `loadPricing()`

**Variables:**
- camelCase for locals and parameters: `sessionDir`, `parsedLines`, `tokenUsage`
- UPPER_SNAKE_CASE for constants: `MAX_SESSION_FILE_BYTES`, `CACHE_TTL_MS`, `WEB_SEARCH_COST`
- Module-level mutable state uses descriptive names: `pricingCache`, `sortedPricingKeys`

**Types:**
- PascalCase for all types: `TokenUsage`, `ParsedTurn`, `ClassifiedTurn`
- Type exports from dedicated `types.ts` files: `src/types.ts`, `src/providers/types.ts`
- Use `type` keyword for type-only imports: `import type { Provider } from './types.js'`

## Code Style

**Formatting:**
- No ESLint/Prettier/Biome config detected — formatting enforced by Semgrep CI
- 2-space indentation
- No semicolons (implicit ASI style)
- Single quotes for strings
- Trailing commas in multi-line structures

**Linting:**
- Semgrep CI gate: `.semgrep/rules/no-bracket-assign-hot-paths.yml`
- Rule: `no-bracket-assign-on-literal-object-map` — must use `Object.create(null)` for maps with external keys
- Scoped to `src/providers/*.ts` and `src/parser.ts`

**TypeScript Config:**
- `tsconfig.json`: strict mode, ES2022 target, ESNext modules, bundler resolution
- JSX: `react-jsx` (for Ink TUI components)
- Source maps enabled, declarations enabled

## Import Organization

**Order:**
1. Node.js built-ins: `import { readFile } from 'fs/promises'`
2. External packages: `import chalk from 'chalk'`
3. Internal modules (relative): `import { classifyTurn } from './classifier.js'`

**Path Aliases:**
- No path aliases — all imports use relative paths with `.js` extension
- Example: `import { calculateCost } from './models.js'`

**Barrel Files:**
- `src/providers/index.ts` — re-exports all providers and provides `getAllProviders()`
- No other barrel files detected

## Error Handling

**Patterns:**
- Try-catch with empty catch blocks for optional operations: `catch { return null }`
- Error codes extracted from Node.js errors: `(err as NodeJS.ErrnoException).code`
- Graceful degradation: return null/empty rather than throwing
- Validate input data structure before processing (see `session-cache.ts` validation)

**Example:**
```typescript
try {
  const raw = await readFile(getConfigPath(), 'utf-8')
  return JSON.parse(raw) as CodeburnConfig
} catch {
  return {}
}
```

## Logging

**Framework:** Custom `warn()` function using `process.stderr.write()`

**Patterns:**
- Controlled by `CODEBURN_VERBOSE` env var
- Prefix with `codeburn: ` for identification
- Use for operational warnings, not application errors
- Never use `console.log` in library code (CLI output uses Ink/React)

```typescript
function verbose(): boolean {
  return process.env.CODEBURN_VERBOSE === '1'
}

function warn(msg: string): void {
  if (verbose()) process.stderr.write(`codeburn: ${msg}\n`)
}
```

## Comments

**When to Comment:**
- Block comments above complex functions explaining algorithm/approach
- Inline comments for non-obvious logic branches
- JSDoc-style `///` for exported functions (not standard JSDoc)
- Regression test comments reference GitHub issues: `// Regression for #420`

**Style:**
- Use `//` for single-line comments
- Use `///` for function documentation (TypeScript-style)
- Use `/* */` for multi-line block comments in rare cases

## Function Design

**Size:** Functions typically 20-80 lines. Larger functions broken into helpers.

**Parameters:**
- Use options objects for functions with 3+ parameters
- Use `Partial<Type>` with defaults for flexible test helpers
- Destructure in function signature when clear

**Return Values:**
- Return `null` for "not found" / "no result" cases
- Return tuples or objects for multiple values
- Use discriminated unions for state: `{ action: 'new' } | { action: 'appended'; readFromOffset: number }`

## Module Design

**Exports:**
- Named exports only — no default exports
- Export types alongside their implementations
- Re-export from barrel files when providing unified API

**Internal Modules:**
- Helper functions are module-private (not exported)
- Shared constants exported as `const` with `export`
- Types co-located in dedicated `types.ts` files

## Async Patterns

**Style:** Async/await exclusively — no raw Promises or callbacks

**Generators:**
- Use `async function*` for streaming data: `readSessionLines()` returns `AsyncGenerator<string>`
- Consumers use `for await...of` loops

**Concurrent Loading:**
- Use `Promise.all()` for independent async operations
- Lazy-load optional modules with try-catch: `loadAntigravity()`, `loadForge()`

## Environment Variables

**Convention:**
- Prefix with `CODEBURN_` for app-specific: `CODEBURN_CACHE_DIR`, `CODEBURN_VERBOSE`
- Use existing tool prefixes: `CLAUDE_CONFIG_DIR`, `CLAUDE_CONFIG_DIRS`
- Access via `process.env['VAR_NAME']` (bracket notation for type safety)

## Security Patterns

**Prototype Pollution Prevention:**
- Maps with external keys MUST use `Object.create(null)` (enforced by Semgrep)
- No bracket-assign on `{}`-created maps with dynamic keys
- Input validation on all parsed JSON data (see `session-cache.ts` deep validation)

**File System:**
- Atomic writes: write to `.tmp` file, then `rename()`
- File locking via randomized temp paths to prevent race conditions

---

*Convention analysis: 2026-06-12*
