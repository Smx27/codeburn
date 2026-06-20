# Regression Checklist

Comprehensive regression test checklist for AIInsight.

## CLI Regression

### Commands

- [ ] `aiinsight --version` displays version
- [ ] `aiinsight --help` shows help
- [ ] `aiinsight report` generates report
- [ ] `aiinsight report --format json` outputs JSON
- [ ] `aiinsight today` shows today's data
- [ ] `aiinsight month` shows month's data
- [ ] `aiinsight export --format csv` exports CSV
- [ ] `aiinsight export --format json` exports JSON
- [ ] `aiinsight status` shows status
- [ ] `aiinsight status --format json` outputs JSON
- [ ] `aiinsight optimize` runs detectors
- [ ] `aiinsight providers` lists providers
- [ ] `aiinsight doctor` runs diagnostics
- [ ] `aiinsight config` shows config
- [ ] `aiinsight config edit` opens editor
- [ ] `aiinsight config reset` clears config
- [ ] `aiinsight login` connects to cloud
- [ ] `aiinsight logout` disconnects from cloud

### Provider Parsing

- [ ] Claude sessions parse correctly
- [ ] Codex sessions parse correctly
- [ ] Cursor sessions parse correctly
- [ ] Gemini sessions parse correctly
- [ ] Warp sessions parse correctly
- [ ] OpenCode sessions parse correctly
- [ ] Cline sessions parse correctly
- [ ] Roo Code sessions parse correctly
- [ ] Kilo Code sessions parse correctly

### Edge Cases

- [ ] Empty sessions handled gracefully
- [ ] Malformed JSONL handled gracefully
- [ ] Missing fields handled gracefully
- [ ] Invalid timestamps handled gracefully
- [ ] Large files processed without errors

## API Regression

### Authentication

- [ ] Registration creates user and org
- [ ] Login returns tokens
- [ ] Refresh token works
- [ ] Logout invalidates tokens
- [ ] Password reset works
- [ ] Email verification works

### Dashboard API

- [ ] Overview endpoint returns data
- [ ] Providers endpoint returns data
- [ ] Models endpoint returns data
- [ ] Users endpoint returns data
- [ ] Projects endpoint returns data
- [ ] Trends endpoint returns data
- [ ] Organization endpoint returns data
- [ ] Agents endpoint returns data
- [ ] Sync jobs endpoint returns data
- [ ] Onboarding endpoint returns data

### Ingestion API

- [ ] Batch upload works
- [ ] Session upload works
- [ ] Event upload works
- [ ] Deduplication works
- [ ] Rate limiting works

### Organization

- [ ] Create organization works
- [ ] Update organization works
- [ ] List teams works
- [ ] Create team works
- [ ] Update team works
- [ ] Delete team works
- [ ] Add team member works
- [ ] Remove team member works

### Invitations

- [ ] Send invitation works
- [ ] List invitations works
- [ ] Accept invitation works
- [ ] Revoke invitation works
- [ ] Resend invitation works

### API Keys

- [ ] Create API key works
- [ ] List API keys works
- [ ] Revoke API key works
- [ ] API key authentication works

### Enrollment Keys

- [ ] Create enrollment key works
- [ ] List enrollment keys works
- [ ] Revoke enrollment key works
- [ ] Rotate enrollment key works

### Agents

- [ ] Register agent works
- [ ] Send heartbeat works
- [ ] List agents works
- [ ] Get agent detail works

## Dashboard Regression

### Pages

- [ ] Landing page loads
- [ ] Login page loads
- [ ] Registration page loads
- [ ] Forgot password page loads
- [ ] Reset password page loads
- [ ] Dashboard page loads
- [ ] Providers page loads
- [ ] Models page loads
- [ ] Users page loads
- [ ] Projects page loads
- [ ] Trends page loads
- [ ] Settings page loads
- [ ] Settings/agents page loads

### Functionality

- [ ] Login flow works
- [ ] Registration flow works
- [ ] Password reset flow works
- [ ] Date range selection works
- [ ] Provider filtering works
- [ ] Export works
- [ ] Settings update works
- [ ] Team management works
- [ ] API key management works
- [ ] Enrollment key management works

### UI

- [ ] Charts render correctly
- [ ] Tables display data correctly
- [ ] Forms submit correctly
- [ ] Navigation works
- [ ] Responsive design works
- [ ] Dark mode works (if applicable)

## Sync Regression

### Agent

- [ ] Login connects to cloud
- [ ] Logout disconnects from cloud
- [ ] Status shows correct info
- [ ] Providers detected correctly
- [ ] Sync completes successfully
- [ ] Historical sync works
- [ ] Incremental sync works
- [ ] Force sync works

### Data Flow

- [ ] Sessions uploaded correctly
- [ ] Events uploaded correctly
- [ ] Deduplication prevents duplicates
- [ ] Checksums skip unchanged files
- [ ] Watermark filters old calls

## Performance Regression

### CLI

- [ ] Report generates in < 5 seconds
- [ ] Export completes in < 10 seconds
- [ ] Sync completes in < 60 seconds

### API

- [ ] Health check responds in < 100ms
- [ ] Dashboard API responds in < 500ms
- [ ] Ingestion API responds in < 500ms
- [ ] Batch upload handles 1000 requests/minute

### Dashboard

- [ ] Pages load in < 3 seconds
- [ ] Charts render in < 2 seconds
- [ ] Tables load in < 2 seconds

## Security Regression

### Authentication

- [ ] Passwords hashed with Argon2
- [ ] JWT tokens expire correctly
- [ ] Refresh tokens rotate correctly
- [ ] API keys hashed with Argon2
- [ ] Rate limiting prevents brute force

### Authorization

- [ ] Users can only access own data
- [ ] Organizations are isolated
- [ ] Roles enforced correctly
- [ ] Admin permissions required for admin actions

## Data Integrity

### Database

- [ ] Foreign keys enforced
- [ ] Unique constraints enforced
- [ ] NOT NULL constraints enforced
- [ ] Cascading deletes work correctly

### Sync

- [ ] Deduplication prevents duplicates
- [ ] Checksums skip unchanged files
- [ ] Watermark filters old calls
- [ ] Batch uploads are atomic

## Related Documentation

- [Smoke Test](smoke-test.md) — Quick verification tests
- [Manual Test Guide](manual-test-guide.md) — Manual testing procedures
- [Release Checklist](release-checklist.md) — Release verification
