# Manual Test Guide

Step-by-step manual testing procedures for AIInsight.

## Setup

### Prerequisites

1. Node.js 22+ installed
2. PostgreSQL running (Docker recommended)
3. AIInsight CLI installed
4. Browser available

### Environment Setup

```bash
# Start services
docker compose up -d

# Run migrations
npm run api:migrate

# Seed test data
npm run dev:setup-org
```

## Test Scenarios

### Scenario 1: New User Onboarding

**Objective:** Verify complete new user flow

**Steps:**
1. Open http://localhost:3000/register
2. Enter name, email, password
3. Click "Create Account"
4. Check email for verification link
5. Click verification link
6. Verify redirect to dashboard
7. Navigate to Settings → API Keys
8. Click "Generate API Key"
9. Copy the API key
10. Open terminal
11. Run `aiinsight login`
12. Paste API key
13. Verify "Connected to AIInsight Cloud"
14. Run `aiinsight sync`
15. Verify sync completes
16. Navigate to Dashboard
17. Verify data appears

**Expected Result:** User can register, verify email, generate API key, connect agent, sync data, and view dashboard.

### Scenario 2: Team Collaboration

**Objective:** Verify team invitation flow

**Steps:**
1. Login as owner
2. Navigate to Settings → Team
3. Click "Invite Member"
4. Enter colleague's email
5. Select "Member" role
6. Click "Send Invitation"
7. Login as colleague (different browser)
8. Check email for invitation
9. Click invitation link
10. Create account
11. Verify added to organization
12. Verify can view dashboard
13. Verify cannot access settings

**Expected Result:** Owner can invite members, members can join and view dashboard.

### Scenario 3: Provider Detection

**Objective:** Verify provider detection works

**Steps:**
1. Install AI coding tools (Claude, Codex, etc.)
2. Run `aiinsight providers`
3. Verify detected providers listed
4. Run `aiinsight sync`
5. Verify sessions from detected providers uploaded
6. Navigate to Dashboard → Providers
7. Verify provider data appears

**Expected Result:** AIInsight detects installed providers and syncs their data.

### Scenario 4: API Key Management

**Objective:** Verify API key lifecycle

**Steps:**
1. Login to dashboard
2. Navigate to Settings → API Keys
3. Create new API key with "read" role
4. Copy the key
5. Test key with curl:
   ```bash
   curl http://localhost:3002/api/v1/dashboard/overview \
     -H "Authorization: Bearer <key>"
   ```
6. Verify 200 response
7. Revoke the key
8. Test key again
9. Verify 401 response

**Expected Result:** API keys can be created, used, and revoked.

### Scenario 5: Invitation Flow

**Objective:** Verify invitation lifecycle

**Steps:**
1. Login as admin
2. Navigate to Settings → Team
3. Send invitation to test email
4. Verify invitation appears in list
5. Resend invitation
6. Verify new email received
7. Revoke invitation
8. Verify invitation removed from list

**Expected Result:** Invitations can be sent, resent, and revoked.

### Scenario 6: Organization Settings

**Objective:** Verify organization management

**Steps:**
1. Login as owner
2. Navigate to Settings → Organization
3. Update organization name
4. Update timezone
5. Update currency
6. Save changes
7. Verify changes persist

**Expected Result:** Organization settings can be updated and saved.

### Scenario 7: Dashboard Analytics

**Objective:** Verify dashboard displays correct data

**Steps:**
1. Login to dashboard
2. Navigate to Dashboard → Overview
3. Verify total cost displayed
4. Verify total sessions displayed
5. Navigate to Dashboard → Providers
6. Verify per-provider breakdown
7. Navigate to Dashboard → Models
8. Verify per-model breakdown
9. Navigate to Dashboard → Users
10. Verify per-user breakdown
11. Navigate to Dashboard → Projects
12. Verify per-project breakdown
13. Navigate to Dashboard → Trends
14. Verify time series data

**Expected Result:** Dashboard displays correct analytics data.

### Scenario 8: Error Handling

**Objective:** Verify error handling works

**Steps:**
1. Try login with wrong password
2. Verify "Invalid credentials" error
3. Try register with existing email
4. Verify "Email already exists" error
5. Try API call without auth
6. Verify 401 response
7. Try API call with expired token
8. Verify 401 response

**Expected Result:** Errors handled gracefully with appropriate messages.

## Test Data

### Test Accounts

| Email | Password | Role |
|-------|----------|------|
| owner@aiinsight.local | password123 | Owner |
| admin@aiinsight.local | password123 | Admin |
| member1@aiinsight.local | password123 | Member |
| member2@aiinsight.local | password123 | Member |
| member3@aiinsight.local | password123 | Member |

### Test Organizations

| Name | Owner |
|------|-------|
| AiInsight Test Org | owner@aiinsight.local |

### Test Teams

| Name | Members |
|------|---------|
| Platform Team | owner, member1 |
| AI Team | owner, member2 |
| Security Team | owner, member3 |

## Bug Reporting

When reporting bugs, include:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots** (if applicable)
5. **Environment:**
   - OS and version
   - Node.js version
   - AIInsight version
   - Browser (for dashboard issues)

## Related Documentation

- [Smoke Test](smoke-test.md) — Quick verification tests
- [Regression Checklist](regression-checklist.md) — Full regression tests
- [Release Checklist](release-checklist.md) — Release verification
