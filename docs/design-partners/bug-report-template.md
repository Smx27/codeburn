# Bug Report Template

Template for reporting bugs as a design partner.

## Overview

Use this template when reporting bugs. Include all relevant information to help us fix the issue quickly.

## Template

```markdown
## Bug Report

### What I Was Trying To Do

[Describe what you were trying to accomplish]

### What I Expected

[Describe what you expected to happen]

### What Actually Happened

[Describe what actually happened]

### Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [See error]

### Environment

- **OS:** [e.g., macOS 14.5, Ubuntu 22.04, Windows 11]
- **AIInsight Version:** [e.g., v1.0.0]
- **Node.js Version:** [e.g., v22.13.0]
- **Browser:** [e.g., Chrome 125, Firefox 126] (for dashboard issues)

### Screenshots

[Attach screenshots if applicable]

### Logs

```
[Paste relevant logs here]
```

### Additional Context

[Any other relevant information]

### Severity

- [ ] Critical — System down, data loss
- [ ] High — Major feature broken
- [ ] Medium — Minor feature issue
- [ ] Low — Enhancement, nice-to-have
```

## Examples

### Good Bug Report

```markdown
## Bug Report

### What I Was Trying To Do

View my usage for the past week.

### What I Expected

See a breakdown by provider showing Claude, Codex, and Cursor usage.

### What Actually Happened

The providers page showed "No data available" even though I have data in the dashboard overview.

### Steps to Reproduce

1. Login to dashboard
2. Navigate to Dashboard → Providers
3. See "No data available" message
4. Navigate to Dashboard → Overview
5. See data exists

### Environment

- **OS:** macOS 14.5
- **AIInsight Version:** v1.0.0
- **Node.js Version:** v22.13.0
- **Browser:** Chrome 125

### Screenshots

[Attached: providers page showing "No data available"]

### Logs

```
No relevant logs
```

### Additional Context

This worked yesterday. I synced data this morning.

### Severity

- [ ] Critical — System down, data loss
- [x] High — Major feature broken
- [ ] Medium — Minor feature issue
- [ ] Low — Enhancement, nice-to-have
```

### Bad Bug Report

```markdown
## Bug Report

It doesn't work.
```

## Tips

### Be Specific

**Bad:** "It's broken"
**Good:** "The providers page shows 'No data available' when data exists"

### Include Steps

**Bad:** "Can't view data"
**Good:** "1. Login, 2. Go to Providers, 3. See 'No data available'"

### Include Environment

**Bad:** "Doesn't work on my computer"
**Good:** "macOS 14.5, AIInsight v1.0.0, Chrome 125"

### Include Screenshots

**Bad:** "The page looks wrong"
**Good:** [Attached screenshot with annotation]

### Be Reproducible

**Bad:** "Sometimes it doesn't work"
**Good:** "Every time I go to Providers page, I see 'No data available'"

## After Submitting

### What Happens Next

1. **Acknowledgment:** We'll acknowledge within 24 hours
2. **Triage:** We'll categorize and prioritize
3. **Investigation:** We'll investigate the issue
4. **Fix:** We'll implement a fix
5. **Release:** We'll release the fix
6. **Follow-up:** We'll let you know it's fixed

### Tracking

You can track your bug report:
- **GitHub Issues:** Link provided after submission
- **Slack:** Updates in #aiinsight-design-partners
- **Email:** Notifications for status changes

## Related Documentation

- [Feedback Process](feedback-process.md) — How to provide feedback
- [Support](support.md) — Getting help
- [Known Issues](../qa/known-issues.md) — Current known issues
