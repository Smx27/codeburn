# Testing

Testing guide for AIInsight.

## Overview

AIInsight uses Vitest for testing with 42 test files and 568 tests.

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/providers/codex.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Test Structure

```
tests/
├── providers/                    # Provider-specific tests
│   ├── codex.test.ts
│   ├── cursor.test.ts
│   ├── cline.test.ts
│   └── ...
├── sync-engine/                  # Sync engine tests
├── analytics-engine/             # Analytics engine tests
├── dashboard-api/                # API tests
└── integration/                  # Integration tests
```

## Writing Tests

### Provider Tests

Each provider should have fixture-based tests:

```typescript
import { describe, it, expect } from 'vitest'
import { parseProvider } from '../../src/providers/codex'

describe('Codex Provider', () => {
  it('parses JSONL sessions', async () => {
    const sessions = await parseProvider('tests/fixtures/codex/sample.jsonl')
    expect(sessions).toHaveLength(1)
    expect(sessions[0].provider).toBe('codex')
  })

  it('calculates cost correctly', async () => {
    const sessions = await parseProvider('tests/fixtures/codex/sample.jsonl')
    expect(sessions[0].totalCostUSD).toBeGreaterThan(0)
  })
})
```

### API Tests

```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/index'

describe('Dashboard API', () => {
  it('returns health check', async () => {
    const res = await request(app).get('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest'
import { SyncEngine } from '../packages/sync-engine'

describe('Sync Engine Integration', () => {
  it('syncs sessions to API', async () => {
    const engine = new SyncEngine(config)
    const result = await engine.sync()
    expect(result.sessionsUploaded).toBeGreaterThan(0)
  })
})
```

## Test Fixtures

Fixtures are stored in `tests/fixtures/`:

```
tests/fixtures/
├── codex/
│   └── sample.jsonl
├── cursor/
│   └── sample.db
└── claude/
    └── sample.jsonl
```

## Coverage

### Viewing Coverage

```bash
npm run test:coverage
open coverage/index.html
```

### Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | 80%+ |
| Branches | 75%+ |
| Functions | 80%+ |
| Lines | 80%+ |

## CI/CD

Tests run automatically in CI:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm install
      - run: npm test
```

## Best Practices

1. **Use real fixtures** — Don't mock provider data, use real JSONL files
2. **Test error cases** — Ensure providers handle malformed data gracefully
3. **Test edge cases** — Empty sessions, missing fields, invalid timestamps
4. **Keep tests fast** — Each test should complete in < 1 second
5. **Use descriptive names** — Test names should describe expected behavior

## Related Documentation

- [Setup](setup.md) — Local development setup
- [Repository Structure](repository-structure.md) — Package details
