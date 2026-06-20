# Release Process

How to release AIInsight.

## Versioning

AIInsight uses semantic versioning (major.minor.patch).

## Before Every Release

Run the test suite to catch any regressions:

```bash
npm test
```

Verify that the build completes without errors:

```bash
npm run build
```

## CLI Release Process

### 1. Update the Version

Edit `package.json` to bump the version number:

```bash
npm version <version>
```

For example, `npm version 1.0.1` updates both files and creates a commit.

### 2. Update the Changelog

Edit `CHANGELOG.md`. Move all changes from the "Unreleased" section into a new section with the version number and today's date:

```markdown
## Unreleased

### ...

## 1.0.1 - 2026-06-20

### Added
- Feature X

### Fixed
- Bug Y
```

Commit these changes:

```bash
git add CHANGELOG.md package.json package-lock.json
git commit -m "chore: bump to 1.0.1"
```

### 3. Publish to npm

```bash
npm publish
```

The `prepublishOnly` script in `package.json` runs `npm run build` first.

If publishing for the first time on a new machine, run `npm login` first.

### 4. Tag the Release

After npm accepts the publish, tag the commit and push:

```bash
git tag v1.0.1
git push origin v1.0.1
```

### 5. Verify npm Publication

```bash
npm view aiinsight version
```

### 6. Create a GitHub Release

Use the GitHub CLI to create a release with notes from the changelog:

```bash
gh release create v1.0.1 --title v1.0.1 --notes "$(sed -n '/^## 1.0.1/,/^## /p' CHANGELOG.md | head -n -1)"
```

## macOS Menubar Release Process

The macOS menubar is released separately with its own GitHub Release, but shares the same version number as the CLI.

### 1. Same Version Bump

Follow the same version bumping process as the CLI.

### 2. Tag the macOS Release

After the CLI tag is published, create a separate tag for the menubar:

```bash
git tag mac-v1.0.1
git push origin mac-v1.0.1
```

### 3. GitHub Actions Builds the Bundle

The `.github/workflows/release-menubar.yml` workflow automatically detects the `mac-v*` tag and builds the bundle.

### 4. Verify the Release

After the workflow completes, the GitHub Release page shows the zip and sha256 files.

## Node SEA Release Process

### 1. Build SEA

```bash
npm run build:sea
```

### 2. Test SEA

```bash
./dist/aiinsight-sea --version
```

### 3. Upload to Release

Upload the SEA binary to the GitHub Release created in the CLI release process.

## Homebrew Core

After publishing a new CLI version to npm, the homebrew-core formula can be updated:

```bash
brew bump-formula-pr aiinsight --url "https://registry.npmjs.org/aiinsight/-/aiinsight-<VERSION>.tgz"
```

## Rollback

If a released version has a critical bug, the fastest path is to fix the bug and cut a new patch release (e.g., 1.0.1 -> 1.0.2).

Delete the broken tag locally and on GitHub:

```bash
git tag -d v1.0.1
git push origin --delete v1.0.1
```

npm does not allow republishing to the same version. If you must unpublish from npm:

```bash
npm unpublish aiinsight@1.0.1 --force
```

## Summary

The CLI release is manual: bump the version, update `CHANGELOG.md`, commit, run `npm publish`, then tag and create a GitHub Release. The macOS menubar release is automated: pushing a `mac-v*` tag fires the workflow. The Node SEA is built and uploaded manually.

## Related Documentation

- [Build](build.md) — Build process
- [Repository Structure](repository-structure.md) — Package details
