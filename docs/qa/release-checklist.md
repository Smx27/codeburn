# Release Checklist

Pre-release verification checklist for AIInsight.

## Pre-Release

### Code Quality

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No lint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Code reviewed and approved

### Documentation

- [ ] CHANGELOG.md updated
- [ ] README.md updated (if needed)
- [ ] API documentation updated (if needed)
- [ ] CLI reference updated (if needed)
- [ ] No broken links

### Security

- [ ] No secrets in code
- [ ] No sensitive data in logs
- [ ] Dependencies updated
- [ ] Security scan passed

## Release Steps

### 1. Version Bump

```bash
npm version <version>
```

### 2. Changelog Update

Move "Unreleased" section to new version:

```markdown
## Unreleased

(empty)

## 1.0.1 - 2026-06-20

### Added
- Feature X

### Fixed
- Bug Y
```

### 3. Commit

```bash
git add CHANGELOG.md package.json package-lock.json
git commit -m "chore: bump to 1.0.1"
```

### 4. Build

```bash
npm run build
```

### 5. Test Build

```bash
node dist/cli.js --version
node dist/cli.js report --period today
```

### 6. Publish to npm

```bash
npm publish
```

### 7. Tag Release

```bash
git tag v1.0.1
git push origin v1.0.1
```

### 8. Verify npm

```bash
npm view aiinsight version
```

### 9. Create GitHub Release

```bash
gh release create v1.0.1 --title v1.0.1 --notes "$(sed -n '/^## 1.0.1/,/^## /p' CHANGELOG.md | head -n -1)"
```

### 10. Build Node SEA (if applicable)

```bash
npm run build:sea
# Upload SEA to GitHub Release
```

## Post-Release

### Verification

- [ ] npm package installs correctly
- [ ] GitHub Release created
- [ ] SEA binary works (if applicable)
- [ ] Homebrew formula updated (if applicable)

### Monitoring

- [ ] Monitor npm downloads
- [ ] Monitor GitHub Issues
- [ ] Monitor error rates

### Communication

- [ ] Announce release on Discord
- [ ] Update status page (if applicable)
- [ ] Send email to design partners (if applicable)

## Rollback Procedure

If critical bug found:

1. **Assess severity**
   - Critical: Immediate rollback
   - High: Rollback within 24 hours
   - Medium: Fix in next release

2. **Rollback steps**
   ```bash
   # Delete broken tag
   git tag -d v1.0.1
   git push origin --delete v1.0.1

   # Unpublish from npm (if critical)
   npm unpublish aiinsight@1.0.1 --force

   # Fix bug and release new version
   npm version 1.0.2
   npm publish
   git tag v1.0.2
   git push origin v1.0.2
   ```

3. **Communicate rollback**
   - Update GitHub Release
   - Notify users on Discord
   - Update status page

## Checklist Template

Copy this template for each release:

```markdown
## Release 1.0.1 Checklist

### Pre-Release
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] Security reviewed

### Release
- [ ] Version bumped
- [ ] Changelog updated
- [ ] Committed
- [ ] Published to npm
- [ ] Tagged
- [ ] GitHub Release created

### Post-Release
- [ ] npm verified
- [ ] GitHub Release verified
- [ ] Monitoring active
- [ ] Communication sent
```

## Related Documentation

- [Build](../developer/build.md) — Build process
- [Release Process](../developer/release-process.md) — Release procedures
- [Smoke Test](smoke-test.md) — Quick verification tests
