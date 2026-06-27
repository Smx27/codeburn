# Niriksh Docker-Based Binary Validation Harness

## Overview

A Docker-based test harness to validate that Niriksh binaries are truly standalone — no Node.js, no npm, no source checkout, no node_modules.

## Directory Structure

```
tests/binary/
├── docker/
│   ├── ubuntu.Dockerfile
│   ├── debian.Dockerfile
│   ├── alpine.Dockerfile
│   └── fedora.Dockerfile
├── docker-compose.yml
└── run-tests.sh
```

## Container Requirements

Each Dockerfile installs ONLY:
- `bash`
- `curl`
- `ca-certificates`

No Node.js. No npm. No python3.

## Artifact Injection

Mount only:
- `dist/niriksh-linux-x64`
- `dist/SHA256SUMS`

Nothing else. No source tree. No node_modules.

## Test Suite (run-tests.sh)

9 tests, pure bash (no python3 dependency):

| # | Test | Validates |
|---|------|-----------|
| 1 | Startup | `--version` produces output, no runtime failures |
| 2 | Status | `status` command exits 0 |
| 3 | Doctor | `doctor` command exits 0 |
| 4 | Providers | `providers` command exits 0 |
| 5 | Login | Login with mock API key succeeds |
| 6 | Config Lifecycle | config.json, machine-id, sync-state, upload-queue, logs created |
| 7 | Corrupt Config | Invalid JSON in config.json produces helpful message, no crash |
| 8 | Queue Recovery | upload-queue directory persists after sync |
| 9 | Source Tree Leakage | No references to node_modules, main.js, require(), __dirname, etc. |

## Usage

### Run all distros via Docker Compose

```bash
cd tests/binary
docker compose up --build --abort-on-container-exit
```

### Run single distro

```bash
docker run --rm \
  -v "$PWD/dist/niriksh-linux-x64:/artifacts/niriksh-linux-x64:ro" \
  -v "$PWD/dist/SHA256SUMS:/artifacts/SHA256SUMS:ro" \
  -e NIRIKSH_BINARY_PATH=/artifacts/niriksh-linux-x64 \
  -e NIRIKSH_SHA_PATH=/artifacts/SHA256SUMS \
  niriksh-binary-ubuntu \
  bash /usr/local/bin/run-tests.sh
```

### Run locally (without Docker)

```bash
cd tests/binary
NIRIKSH_BINARY_PATH=../../dist/niriksh-linux-x64 \
NIRIKSH_SHA_PATH=../../dist/SHA256SUMS \
bash run-tests.sh
```

## Output Report

`run-tests.sh` outputs a JSON report to stdout:

```json
{
  "startup": "PASS",
  "status": "PASS",
  "doctor": "PASS",
  "providers": "PASS",
  "login": "PASS",
  "config": "PASS",
  "queue": "PASS",
  "corruptConfig": "PASS",
  "sourceTreeLeakage": "PASS",
  "binaryHealthPercent": 100,
  "standalonePercent": 100,
  "criticalFailures": []
}
```

## CI Integration

`.github/workflows/binary-validation.yml` runs the matrix on push/PR:

- Matrix: ubuntu, debian, alpine, fedora
- Validates binary exists before running
- Checks binary for Node.js runtime dependencies (strings scan)
- Runs full test suite per distro
- Fails the build if binaryHealthPercent < 100
- Uploads per-distro JSON reports as artifacts

## Final Verdict Format

```
Binary Health: X%
Standalone:    X%
Tests Passed:  N/9
Critical Failures: N
```

Ready For:
- Linux Release: YES/NO
- Windows Release: YES/NO
- Mac Release: YES/NO
- Design Partners: YES/NO
- Public Beta: YES/NO
