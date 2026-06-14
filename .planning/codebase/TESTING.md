# Testing Patterns

**Analysis Date:** 2026-06-12

## Test Framework

**Runner:**
- Vitest 3.1.0
- Config: No explicit `vitest.config.ts` — uses defaults with `package.json` `"test": "vitest"` script

**Assertion Library:**
- Vitest built-in (`expect` from `vitest`)
- Chai-compatible matchers: `toBe`, `toEqual`, `toContain`, `toBeCloseTo`, `toBeNull`, `toBeDefined`

**Run Commands:**
```bash
npm test              # Run all tests in watch mode
npx vitest run        # Single run (CI mode)
npx vitest --coverage # Coverage report
```

## Test File Organization

**Location:**
- Co-located tests in `tests/` directory (NOT alongside source files)
- Provider tests in `tests/providers/` subdirectory
- Security tests in `tests/security/` subdirectory

**Naming:**
- Pattern: `{module-name}.test.ts`
- Examples: `classifier.test.ts`, `parser-large-session.test.ts`

**Structure:**
```
tests/
├── *.test.ts                    # Core module tests
├── providers/
│   └── {provider}.test.ts       # Provider-specific tests
├── security/
│   └── prototype-pollution.test.ts
└── fixtures/
    └── security/                # Test fixture JSONL files
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('feature group', () => {
  describe('specific behavior', () => {
    it('does expected thing', () => {
      // arrange
      const input = makeInput()
      
      // act
      const result = functionUnderTest(input)
      
      // assert
      expect(result).toBe(expected)
    })
  })
})
```

**Patterns:**
- `beforeAll` for one-time async setup (e.g., `loadPricing()`)
- `beforeEach` for per-test setup (e.g., create temp dirs, set env vars)
- `afterEach` for cleanup (e.g., delete temp dirs, restore env vars)
- `afterAll` not commonly used — prefer `afterEach` for isolation

## Mocking

**Framework:** No mocking library — pure Vitest with manual mocks

**Patterns:**
```typescript
// Factory functions for test data (NOT mocking)
function makeCall(overrides: Partial<ParsedApiCall> = {}): ParsedApiCall {
  return {
    provider: 'claude',
    model: 'Opus 4.7',
    usage: { inputTokens: 0, outputTokens: 0, ... },
    costUSD: 0,
    tools: [],
    ...overrides,
  }
}

// Environment variable mocking
beforeEach(() => {
  process.env['CODEBURN_CACHE_DIR'] = TMP_DIR
})

afterEach(() => {
  delete process.env['CODEBURN_CACHE_DIR']
})

// HTTP server mocking (real server, not mock)
let server: Server
afterEach(async () => {
  await new Promise<void>(resolve => server?.close(() => resolve()))
})

function listen(handler: (respond: () => void) => void): Promise<string> {
  return new Promise(resolve => {
    server = createServer((_req, res) => handler(() => res.end('{"ok":true}')))
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolve(`http://127.0.0.1:${port}/`)
    })
  })
}
```

**What to Mock:**
- File system operations via temp directories (NOT `jest.mock`)
- Environment variables via `process.env` manipulation
- HTTP servers via real `node:http` servers on random ports

**What NOT to Mock:**
- Business logic — test real implementations
- External APIs — use real servers or skip with `it.skip()`
- Database connections — use in-memory or file-based alternatives

## Fixtures and Factories

**Test Data:**
- Factory functions with `Partial<Type>` overrides: `makeTurn()`, `makeProject()`
- Defaults provide realistic baseline, overrides for specific test cases
- Inline fixture creation (no external fixture files for most tests)

**Location:**
- Security fixtures: `tests/fixtures/security/*.jsonl`
- All other test data created inline in test files

**Example:**
```typescript
function makeTurn(model: string, cost: number, opts: Partial<TurnOpts> = {}): ClassifiedTurn {
  return {
    timestamp: opts.timestamp ?? '2026-04-15T10:00:00Z',
    category: (opts.category ?? 'coding') as TaskCategory,
    retries: opts.retries ?? 0,
    hasEdits: opts.hasEdits ?? false,
    userMessage: '',
    assistantCalls: [makeCall({ model, costUSD: cost, ...opts })],
  }
}
```

## Coverage

**Requirements:** None enforced — no coverage thresholds configured

**View Coverage:**
```bash
npx vitest --coverage
```

## Test Types

**Unit Tests:**
- Scope: Single function or module
- Approach: Pure functions with factory-created inputs
- Example: `tests/classifier.test.ts`, `tests/models.test.ts`

**Integration Tests:**
- Scope: Multiple modules working together
- Approach: Real file system with temp directories, real parsers
- Example: `tests/parser-large-session.test.ts`, `tests/session-cache.test.ts`

**Security Tests:**
- Scope: Vulnerability regression tests
- Approach: Malicious fixtures that must not cause side effects
- Example: `tests/security/prototype-pollution.test.ts`

**E2E Tests:**
- Framework: Not used
- Note: CLI tested via `npm run dev` manually

## Common Patterns

**Async Testing:**
```typescript
it('parses sessions asynchronously', async () => {
  const result = await parseAllSessions(dateRange, 'claude')
  expect(result).toBeDefined()
  expect(result.length).toBeGreaterThan(0)
})

it('streams large files line by line', async () => {
  const lines: string[] = []
  for await (const line of readSessionLines(filePath)) {
    lines.push(line)
  }
  expect(lines.length).toBeGreaterThan(0)
})
```

**Error Testing:**
```typescript
it('handles missing file gracefully', async () => {
  const result = await readSessionFile('/nonexistent/path')
  expect(result).toBeNull()
})

it('rejects invalid JSON', async () => {
  await writeRawCache('{broken')
  const cache = await loadCache()
  expect(cache.providers).toEqual({})
})

it('rejects prototype pollution attempt', async () => {
  await setupPoc('proto-tool.jsonl')
  await expect(parseAllSessions(makeRange(0), 'claude')).resolves.not.toThrow()
  expect(({} as Record<string, unknown>).calls).toBeUndefined()
})
```

**Temp Directory Pattern:**
```typescript
let TMP_DIR: string

beforeEach(async () => {
  TMP_DIR = await mkdtemp(join(tmpdir(), 'codeburn-test-'))
  process.env['CODEBURN_CACHE_DIR'] = TMP_DIR
})

afterEach(async () => {
  delete process.env['CODEBURN_CACHE_DIR']
  if (existsSync(TMP_DIR)) await rm(TMP_DIR, { recursive: true })
})
```

**Parameterized Tests:**
```typescript
const cases: Array<[string, string]> = [
  ['claude-4-sonnet', 'claude-sonnet-4'],
  ['claude-4.5-opus', 'claude-opus-4-5'],
]

for (const [input, expected] of cases) {
  it(`${input} resolves to ${expected} pricing`, () => {
    const costs = getModelCosts(input)
    expect(costs).not.toBeNull()
    expect(costs!.inputCostPerToken).toBe(getModelCosts(expected)!.inputCostPerToken)
  })
}
```

## Test Conventions

**Naming:**
- Use descriptive `it('does X when Y')` format
- Include GitHub issue numbers for regressions: `it('maps gpt-4o-mini correctly (#420)')`

**Isolation:**
- Each test is fully isolated — no shared state between tests
- Use `beforeEach`/`afterEach` for setup/cleanup
- Never depend on test execution order

**Assertions:**
- Prefer specific matchers: `toBeCloseTo()` for floats, `toContain()` for strings
- Use `expect(...).not.toBeNull()` before accessing properties
- Chain assertions for readability

---

*Testing analysis: 2026-06-12*
