# Smoke Test

Quick verification tests for AIInsight.

## Pre-Release Smoke Test

Run these tests before any release to ensure basic functionality works.

### 1. CLI Installation

```bash
# Verify installation
aiinsight --version
# Expected: aiinsight v1.0.0

# Verify help
aiinsight --help
# Expected: Help output with all commands
```

### 2. Provider Detection

```bash
# List providers
aiinsight providers
# Expected: List of detected providers
```

### 3. Configuration

```bash
# Show config
aiinsight config
# Expected: Configuration output (may show "Not connected")
```

### 4. Doctor Check

```bash
# Run diagnostics
aiinsight doctor
# Expected: All checks pass
```

### 5. Report Generation

```bash
# Generate report
aiinsight report --period today --format json
# Expected: JSON output with usage data
```

## API Smoke Test

### 1. Health Check

```bash
# Ingestion API
curl http://localhost:3001/api/v1/health
# Expected: {"status":"ok"}

# Dashboard API
curl http://localhost:3002/api/v1/health
# Expected: {"status":"ok"}
```

### 2. Version Check

```bash
curl http://localhost:3002/api/v1/version
# Expected: {"version":"1.0.0","name":"aiinsight-dashboard-api"}
```

### 3. Registration

```bash
curl -X POST http://localhost:3002/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "organizationName": "Test Org"
  }'
# Expected: 200 with tokens
```

### 4. Login

```bash
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
# Expected: 200 with tokens
```

## Dashboard Smoke Test

### 1. Web Interface

1. Open http://localhost:3000
2. Verify landing page loads
3. Click "Get Started"
4. Verify registration page loads

### 2. Login Flow

1. Navigate to http://localhost:3000/login
2. Enter credentials
3. Verify redirect to dashboard

### 3. Dashboard Pages

1. Navigate to each dashboard page
2. Verify no JavaScript errors
3. Verify charts render (even with no data)

## Sync Smoke Test

### 1. Agent Login

```bash
aiinsight login
# Paste API key when prompted
# Expected: Connected to AIInsight Cloud
```

### 2. Provider Detection

```bash
aiinsight providers
# Expected: Detected providers listed
```

### 3. Sync Execution

```bash
aiinsight sync
# Expected: Sync complete message
```

### 4. Data Verification

```bash
# Check dashboard for data
curl http://localhost:3002/api/v1/dashboard/overview \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with overview data
```

## Pass/Fail Criteria

| Test | Pass Condition |
|------|----------------|
| CLI Installation | Version displays correctly |
| Provider Detection | At least 1 provider detected |
| Configuration | Config shows without errors |
| Doctor Check | All checks pass |
| Report Generation | Valid JSON output |
| API Health | Both APIs return "ok" |
| Registration | 200 response with tokens |
| Login | 200 response with tokens |
| Dashboard | Pages load without errors |
| Agent Login | Connected message |
| Sync | Sync complete message |
| Data Verification | Overview data returned |

## Automation

### GitHub Actions

```yaml
name: Smoke Test
on: [push, pull_request]
jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm install
      - run: npm run build
      - run: npm test -- --grep "smoke"
```

## Related Documentation

- [Regression Checklist](regression-checklist.md) — Full regression tests
- [Manual Test Guide](manual-test-guide.md) — Manual testing procedures
- [Release Checklist](release-checklist.md) — Release verification
