# AIInsight Binary Validation Report

Date: 2026-06-20

## Final Verdict

Binary Health: 0%

Standalone: 0%

Critical Failures: 9

Ready For:

- Linux Release: NO
- Windows Release: NO
- Mac Release: NO
- Design Partners: NO
- Public Beta: NO

## Root Cause

The current `aiinsight-linux-x64` binary is NOT a true Single Executable Application (SEA).

It is a Node.js SEA blob that still expects a sibling `main.js` file and resolves runtime packages from `node_modules`. When run in an isolated Docker container with only the binary mounted, every command fails with:

```
Cannot find module '/tmp/aiinsight-binary-test/artifacts/main.js' imported from /workspace/
```

This means the binary is NOT standalone. It depends on the source tree.

## Test Matrix

### Ubuntu 24.04

| Test | Result |
|------|--------|
| Startup | FAIL |
| Status | FAIL |
| Doctor | FAIL |
| Providers | FAIL |
| Login | FAIL |
| Config | FAIL |
| Queue | FAIL |
| Corrupt Config | FAIL |
| Source Tree Leakage | FAIL |

### Debian 12 (Slim)

| Test | Result |
|------|--------|
| Startup | FAIL |
| Status | FAIL |
| Doctor | FAIL |
| Providers | FAIL |
| Login | FAIL |
| Config | FAIL |
| Queue | FAIL |
| Corrupt Config | FAIL |
| Source Tree Leakage | FAIL |

### Alpine 3.20

| Test | Result |
|------|--------|
| Startup | FAIL |
| Status | FAIL |
| Doctor | FAIL |
| Providers | FAIL |
| Login | FAIL |
| Config | FAIL |
| Queue | FAIL |
| Corrupt Config | FAIL |
| Source Tree Leakage | PASS (binary couldn't start) |

Note: Alpine uses musl libc. The binary is compiled against glibc and cannot execute at all on Alpine. A separate musl build or static binary is required for Alpine support.

### Fedora 40

| Test | Result |
|------|--------|
| Startup | FAIL |
| Status | FAIL |
| Doctor | FAIL |
| Providers | FAIL |
| Login | FAIL |
| Config | FAIL |
| Queue | FAIL |
| Corrupt Config | FAIL |
| Source Tree Leakage | FAIL |

## Critical Failures

1. **Binary expects `main.js` sibling** — The SEA build did not embed the entry point properly. Running from an isolated directory produces `Cannot find module 'main.js'`.

2. **Runtime package dependencies leak** — Even with `main.js` present, the binary resolves packages from `node_modules` via relative paths. This is not standalone.

3. **Alpine incompatibility** — The glibc-linked binary cannot execute on musl-based Alpine. Either provide a static binary or document Alpine as unsupported.

4. **No version output** — `--version` fails before producing any output, so the startup test has no version confirmation.

## What Must Be Fixed

1. Complete the SEA build so `main.js` is embedded in the binary blob
2. Ensure all runtime packages are bundled (no external `node_modules` resolution)
3. Produce a static or musl-linked binary for Alpine, or document Alpine as unsupported
4. Add `--version` flag that works without any file dependencies

## Harness Files Created

| File | Purpose |
|------|---------|
| `tests/binary/docker/ubuntu.Dockerfile` | Ubuntu 24.04 test container |
| `tests/binary/docker/debian.Dockerfile` | Debian 12 slim test container |
| `tests/binary/docker/alpine.Dockerfile` | Alpine 3.20 test container |
| `tests/binary/docker/fedora.Dockerfile` | Fedora 40 test container |
| `tests/binary/run-tests.sh` | 9-test validation suite (pure bash, no python3) |
| `tests/binary/docker-compose.yml` | Run all 4 distros with one command |
| `.github/workflows/binary-validation.yml` | CI matrix across all distros |
