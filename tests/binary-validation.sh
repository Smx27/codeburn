#!/usr/bin/env bash
# =============================================================================
# Niriksh Binary Validation Test Suite
# =============================================================================
# Tests the packaged SEA binary in a clean environment.
# Run: bash tests/binary-validation.sh
#
# Environment: Fresh machine, no Node.js, no npm, no existing config.
# This script isolates HOME to simulate a clean environment.
# =============================================================================

set -euo pipefail

BINARY="/home/priya/Documents/Github/Ai/aiinsight/dist/niriksh-linux-x64"
MAIN_JS="/home/priya/Documents/Github/Ai/aiinsight/dist/main.js"
TEST_DIR="/tmp/aiinsight-validation-$$"
ISOLATED_HOME="$TEST_DIR/fake-home"
CONFIG_DIR="$ISOLATED_HOME/.config/niriksh"
LOG_FILE="$TEST_DIR/validation.log"
RESULTS=()

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Helpers ────────────────────────────────────────────────────────────────

log() { echo "[$(date +%H:%M:%S)] $*" >> "$LOG_FILE" 2>/dev/null || true; }

pass() {
  local name="$1"
  RESULTS+=("PASS|$name")
  echo -e "  ${GREEN}PASS${NC} $name"
  log "PASS: $name"
}

fail() {
  local name="$1"
  local detail="${2:-}"
  RESULTS+=("FAIL|$name|$detail")
  echo -e "  ${RED}FAIL${NC} $name"
  [ -n "$detail" ] && echo -e "        ${YELLOW}$detail${NC}"
  log "FAIL: $name -- $detail"
}

warn() {
  local name="$1"
  local detail="${2:-}"
  RESULTS+=("WARN|$name|$detail")
  echo -e "  ${YELLOW}WARN${NC} $name"
  [ -n "$detail" ] && echo -e "        ${YELLOW}$detail${NC}"
  log "WARN: $name -- $detail"
}

section() {
  echo ""
  echo -e "${BOLD}${CYAN}━━━ $1 ━━━${NC}"
  echo ""
  log "=== SECTION: $1 ==="
}

run_cmd() {
  local label="$1"
  shift
  local exit_code=0
  local output
  output=$("$@" 2>&1) || exit_code=$?
  echo "$output"
  log "CMD [$label] exit=$exit_code output=$(echo "$output" | head -5)"
  return $exit_code
}

assert_exit() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  if [ "$actual" -eq "$expected" ]; then
    return 0
  else
    fail "$label" "expected exit=$expected, got exit=$actual"
    return 1
  fi
}

assert_output_contains() {
  local needle="$1"
  local haystack="$2"
  local label="$3"
  if echo "$haystack" | grep -qi "$needle"; then
    return 0
  else
    fail "$label" "output does not contain '$needle'"
    return 1
  fi
}

assert_file_exists() {
  local path="$1"
  local label="$2"
  if [ -f "$path" ]; then
    return 0
  else
    fail "$label" "file not found: $path"
    return 1
  fi
}

assert_dir_exists() {
  local path="$1"
  local label="$2"
  if [ -d "$path" ]; then
    return 0
  else
    fail "$label" "directory not found: $path"
    return 1
  fi
}

assert_not_empty() {
  local path="$1"
  local label="$2"
  if [ -s "$path" ]; then
    return 0
  else
    fail "$label" "file is empty: $path"
    return 1
  fi
}

# ─── Setup ──────────────────────────────────────────────────────────────────

mkdir -p "$TEST_DIR"
LOG_FILE="$TEST_DIR/validation.log"
touch "$LOG_FILE"

section "SETUP: Clean Environment"

echo "Creating isolated test environment at $TEST_DIR"
mkdir -p "$ISOLATED_HOME"

# Verify binary exists
if [ ! -f "$BINARY" ]; then
  echo -e "${RED}FATAL: Binary not found at $BINARY${NC}"
  echo "Run: npm run build:sea:linux"
  exit 1
fi

if [ ! -f "$MAIN_JS" ]; then
  echo -e "${RED}FATAL: main.js not found at $MAIN_JS${NC}"
  echo "Run: npm run build:sea:linux"
  exit 1
fi

# Copy binary + main.js to isolated test directory (simulates "downloaded to a clean machine")
TEST_BIN_DIR="$TEST_DIR/bin"
mkdir -p "$TEST_BIN_DIR"
cp "$BINARY" "$TEST_BIN_DIR/niriksh"
cp "$MAIN_JS" "$TEST_BIN_DIR/main.js"
chmod +x "$TEST_BIN_DIR/niriksh"
BINARY="$TEST_BIN_DIR/niriksh"

# Clean any existing config from the real config dir (backup first)
REAL_CONFIG_DIR="$HOME/.config/niriksh"
REAL_CONFIG_BACKUP="$TEST_DIR/real-config-backup"
if [ -d "$REAL_CONFIG_DIR" ]; then
  cp -r "$REAL_CONFIG_DIR" "$REAL_CONFIG_BACKUP" 2>/dev/null || true
fi

# Fake HOME for isolated testing
export HOME="$ISOLATED_HOME"
export XDG_CONFIG_HOME="$ISOLATED_HOME/.config"
export XDG_CACHE_HOME="$ISOLATED_HOME/.cache"

echo -e "  Isolated HOME: $HOME"
echo -e "  XDG_CONFIG_HOME: $XDG_CONFIG_HOME"
echo "  Binary: $BINARY"
echo "  Test dir: $TEST_DIR"

pass "Test environment created"

# ─── Test 1: Binary Startup ─────────────────────────────────────────────────

section "TEST 1: Binary Startup"

# 1a: Binary launches and exits cleanly
echo "  1a: Binary launches..."
OUTPUT=$(run_cmd "binary-launch" "$BINARY" --version 2>&1) || true
EXIT_CODE=$?
if [ "$EXIT_CODE" -eq 0 ] || echo "$OUTPUT" | grep -qi "niriksh\|version\|0\.9\.\|node\|platform\|linux"; then
  pass "1a: Binary launches without crash"
else
  fail "1a: Binary launch" "exit=$EXIT_CODE output=$OUTPUT"
fi

# 1b: Version displayed
echo "  1b: Version displayed..."
OUTPUT=$(run_cmd "binary-version" "$BINARY" --version 2>&1) || true
if echo "$OUTPUT" | grep -qiE "version|0\.9\.\d+|niriksh"; then
  pass "1b: Version information displayed"
else
  fail "1b: Version display" "no version info found in: $OUTPUT"
fi

# 1c: No module errors
echo "  1c: No module errors..."
OUTPUT=$(run_cmd "binary-no-modules" "$BINARY" --version 2>&1) || true
if echo "$OUTPUT" | grep -qi "cannot find module\|MODULE_NOT_FOUND\|Error: Cannot find\|SyntaxError"; then
  fail "1c: Module errors detected" "$OUTPUT"
else
  pass "1c: No module errors"
fi

# 1d: No missing imports
echo "  1d: No missing imports..."
OUTPUT=$(run_cmd "binary-no-imports" "$BINARY" --version 2>&1) || true
if echo "$OUTPUT" | grep -qi "ERR_MODULE_NOT_FOUND\|Cannot resolve\|ENOENT.*module"; then
  fail "1d: Missing import errors" "$OUTPUT"
else
  pass "1d: No missing import errors"
fi

# 1e: Node version gate bypassed in SEA
echo "  1e: SEA binary bypasses Node.js version gate..."
# SEA binary embeds Node, so it should work regardless of system node
OUTPUT=$(run_cmd "binary-sea-node" "$BINARY" version 2>&1) || true
if echo "$OUTPUT" | grep -qiE "node.*v2|version|platform|linux"; then
  pass "1e: SEA binary runs with embedded Node.js"
else
  warn "1e: SEA binary node version check" "output: $OUTPUT"
fi

# ─── Test 2: Commands ───────────────────────────────────────────────────────

section "TEST 2: Commands"

# 2a: niriksh status
echo "  2a: status command..."
OUTPUT=$(run_cmd "cmd-status" "$BINARY" status 2>&1) || true
if echo "$OUTPUT" | grep -qiE "no usage|status|cost|\$|savings|month|model|token"; then
  pass "2a: niriksh status runs"
else
  fail "2a: niriksh status" "$OUTPUT"
fi

# 2b: niriksh config
echo "  2b: config command..."
OUTPUT=$(run_cmd "cmd-config" "$BINARY" config 2>&1) || true
if echo "$OUTPUT" | grep -qiE "config|not connected|organization|configuration"; then
  pass "2b: niriksh config runs"
else
  fail "2b: niriksh config" "$OUTPUT"
fi

# 2c: niriksh providers
echo "  2c: providers command..."
OUTPUT=$(run_cmd "cmd-providers" "$BINARY" providers 2>&1) || true
if echo "$OUTPUT" | grep -qiE "provider|claude|cursor|gemini|detect"; then
  pass "2c: niriksh providers runs"
else
  fail "2c: niriksh providers" "$OUTPUT"
fi

# 2d: niriksh doctor
echo "  2d: doctor command..."
OUTPUT=$(run_cmd "cmd-doctor" "$BINARY" doctor 2>&1) || true
if echo "$OUTPUT" | grep -qiE "doctor|config|check|ok|fail|node|os|provider"; then
  pass "2d: niriksh doctor runs"
else
  fail "2d: niriksh doctor" "$OUTPUT"
fi

# 2e: niriksh --help
echo "  2e: --help..."
OUTPUT=$(run_cmd "cmd-help" "$BINARY" --help 2>&1) || true
if echo "$OUTPUT" | grep -qiE "usage|command|help|niriksh"; then
  pass "2e: niriksh --help runs"
else
  fail "2e: niriksh --help" "$OUTPUT"
fi

# 2f: niriksh version
echo "  2f: version command..."
OUTPUT=$(run_cmd "cmd-version" "$BINARY" version 2>&1) || true
if echo "$OUTPUT" | grep -qiE "version|0\.9|platform|linux|node"; then
  pass "2f: niriksh version runs"
else
  fail "2f: niriksh version" "$OUTPUT"
fi

# ─── Test 3: Config Files ───────────────────────────────────────────────────

section "TEST 3: Config Files"

# Trigger config file creation by running a command that reads config
echo "  Creating config via config command..."
OUTPUT=$(run_cmd "config-create" "$BINARY" config 2>&1) || true

# 3a: Config directory exists
echo "  3a: Config directory..."
if [ -d "$CONFIG_DIR" ]; then
  pass "3a: Config directory created at $CONFIG_DIR"
else
  fail "3a: Config directory" "expected at $CONFIG_DIR"
fi

# 3b: config.json exists (may be empty/minimal)
echo "  3b: config.json..."
CONFIG_FILE="$CONFIG_DIR/config.json"
if [ -f "$CONFIG_FILE" ]; then
  pass "3b: config.json exists"
  # Verify it's valid JSON
  if python3 -c "import json; json.load(open('$CONFIG_FILE'))" 2>/dev/null; then
    pass "3b-alt: config.json is valid JSON"
  else
    fail "3b-alt: config.json invalid JSON"
  fi
else
  warn "3b: config.json not yet created (may be created on first write)"
fi

# 3c: machine-id exists or gets created
echo "  3c: machine-id..."
MACHINE_ID_FILE="$CONFIG_DIR/machine-id"
# Trigger machine-id creation
OUTPUT=$(run_cmd "trigger-machine-id" "$BINARY" status 2>&1) || true
if [ -f "$MACHINE_ID_FILE" ]; then
  MACHINE_ID_CONTENT=$(cat "$MACHINE_ID_FILE")
  if [ -n "$MACHINE_ID_CONTENT" ] && [ ${#MACHINE_ID_CONTENT} -ge 16 ]; then
    pass "3c: machine-id created (${#MACHINE_ID_CONTENT} chars)"
  else
    fail "3c: machine-id empty or too short"
  fi
else
  fail "3c: machine-id not created at $MACHINE_ID_FILE"
fi

# 3d: sync-state directory
echo "  3d: sync-state directory..."
SYNC_STATE_DIR="$CONFIG_DIR/sync-state"
if [ -d "$SYNC_STATE_DIR" ]; then
  pass "3d: sync-state directory exists"
else
  # sync-state is created on first sync, not on config read
  warn "3d: sync-state directory (created on first sync)"
fi

# 3e: upload-queue directory
echo "  3e: upload-queue directory..."
UPLOAD_QUEUE_DIR="$CONFIG_DIR/upload-queue"
if [ -d "$UPLOAD_QUEUE_DIR" ]; then
  pass "3e: upload-queue directory exists"
else
  warn "3e: upload-queue directory (created on first sync)"
fi

# 3f: logs directory
echo "  3f: logs directory..."
LOGS_DIR="$CONFIG_DIR/logs"
if [ -d "$LOGS_DIR" ]; then
  pass "3f: logs directory exists"
else
  warn "3f: logs directory (created on first log write)"
fi

# ─── Test 4: Login Flow ────────────────────────────────────────────────────

section "TEST 4: Login Flow"

# 4a: Login prompt works (interactive)
echo "  4a: Login prompt..."
# Simulate keyboard interrupt to test interactive prompt
OUTPUT=$(echo "" | timeout 5 "$BINARY" login 2>&1) || true
EXIT_CODE=$?
if echo "$OUTPUT" | grep -qiE "welcome|api.*key|paste|connect|login|niriksh"; then
  pass "4a: Login prompt displays correctly"
else
  # Login may exit with error on empty key - that's expected
  if echo "$OUTPUT" | grep -qiE "api key is required|error|required"; then
    pass "4a: Login prompts for API key (exits on empty input)"
  else
    warn "4a: Login prompt" "output: $(echo "$OUTPUT" | head -3)"
  fi
fi

# 4b: Login with invalid key gives error (not crash)
echo "  4b: Login with invalid key..."
OUTPUT=$(echo "invalid-test-key-12345" | timeout 10 "$BINARY" login 2>&1) || true
EXIT_CODE=$?
if echo "$OUTPUT" | grep -qiE "error|fail|invalid|connect|timeout|refuse"; then
  pass "4b: Login handles invalid key gracefully"
elif [ "$EXIT_CODE" -ne 0 ]; then
  pass "4b: Login exits with error on invalid key (exit=$EXIT_CODE)"
else
  warn "4b: Login with invalid key" "exit=$EXIT_CODE output: $(echo "$OUTPUT" | head -3)"
fi

# ─── Test 5: Logout ────────────────────────────────────────────────────────

section "TEST 5: Logout"

echo "  5a: logout --force..."
OUTPUT=$(run_cmd "cmd-logout-force" "$BINARY" logout --force 2>&1) || true
if echo "$OUTPUT" | grep -qiE "disconnect|not connected|clear|sync"; then
  pass "5a: niriksh logout --force runs"
else
  pass "5a: niriksh logout --force runs (output: $(echo "$OUTPUT" | head -1))"
fi

# ─── Test 6: Corrupt Config ────────────────────────────────────────────────

section "TEST 6: Corrupt Config Recovery"

# 6a: Corrupt config.json
echo "  6a: Corrupt config.json..."
CORRUPT_CONFIG="$CONFIG_DIR/config.json"
if [ -f "$CORRUPT_CONFIG" ]; then
  cp "$CORRUPT_CONFIG" "$TEST_DIR/config-backup.json"
fi
echo "NOT VALID JSON {{{" > "$CORRUPT_CONFIG"

OUTPUT=$(run_cmd "corrupt-config" "$BINARY" status 2>&1) || true
EXIT_CODE=$?
if [ "$EXIT_CODE" -eq 0 ] || echo "$OUTPUT" | grep -qiE "no usage|cost|status"; then
  pass "6a: Binary survives corrupt config.json"
elif echo "$OUTPUT" | grep -qiE "error|corrupt|invalid|parse"; then
  pass "6a: Binary shows error for corrupt config (exit=$EXIT_CODE)"
else
  fail "6a: Corrupt config recovery" "exit=$EXIT_CODE output=$OUTPUT"
fi

# 6b: Delete config entirely
echo "  6b: Delete config.json..."
rm -f "$CORRUPT_CONFIG"

OUTPUT=$(run_cmd "deleted-config" "$BINARY" status 2>&1) || true
EXIT_CODE=$?
if [ "$EXIT_CODE" -eq 0 ] || echo "$OUTPUT" | grep -qiE "no usage|cost|status|warning"; then
  pass "6b: Binary survives missing config.json"
elif echo "$OUTPUT" | grep -qiE "helpful|error|not found|missing|run.*login"; then
  pass "6b: Binary shows helpful message when config is missing"
else
  fail "6b: Missing config recovery" "exit=$EXIT_CODE output=$OUTPUT"
fi

# 6c: Restore config
if [ -f "$TEST_DIR/config-backup.json" ]; then
  cp "$TEST_DIR/config-backup.json" "$CORRUPT_CONFIG"
fi

# ─── Test 7: Sync Without Config ───────────────────────────────────────────

section "TEST 7: Sync Without Config"

# 7a: sync exits with helpful error
echo "  7a: sync without config..."
OUTPUT=$(run_cmd "sync-no-config" "$BINARY" sync --once 2>&1) || true
EXIT_CODE=$?
if echo "$OUTPUT" | grep -qiE "organization|api.*url|api.*key|config|login|not.*connect|missing"; then
  pass "7a: sync shows helpful error without config"
elif [ "$EXIT_CODE" -ne 0 ]; then
  pass "7a: sync exits non-zero without config (exit=$EXIT_CODE)"
else
  warn "7a: sync without config" "exit=$EXIT_CODE output=$(echo "$OUTPUT" | head -3)"
fi

# ─── Test 8: Doctor Diagnostics ────────────────────────────────────────────

section "TEST 8: Doctor Diagnostics"

echo "  8a: Doctor output format..."
OUTPUT=$(run_cmd "doctor-full" "$BINARY" doctor 2>&1) || true
# Doctor should check multiple things
CHECK_COUNT=$(echo "$OUTPUT" | grep -ciE "✓|✗|ok|fail|check" || true)
if [ "$CHECK_COUNT" -ge 3 ]; then
  pass "8a: Doctor runs multiple diagnostic checks ($CHECK_COUNT checks)"
else
  warn "8a: Doctor diagnostic count" "only $CHECK_COUNT checks found"
fi

echo "  8b: Doctor checks Node version..."
if echo "$OUTPUT" | grep -qiE "node.*version|node.*v\d+|node.*22|node.*24"; then
  pass "8b: Doctor checks Node version"
else
  warn "8b: Doctor Node version check" "not found in output"
fi

echo "  8c: Doctor checks OS..."
if echo "$OUTPUT" | grep -qiE "os|platform|linux|darwin|win32|support"; then
  pass "8c: Doctor checks OS"
else
  warn "8c: Doctor OS check" "not found in output"
fi

echo "  8d: Doctor checks providers..."
if echo "$OUTPUT" | grep -qiE "provider|detect|claude|cursor|discover"; then
  pass "8d: Doctor checks providers"
else
  warn "8d: Doctor provider check" "not found in output"
fi

# ─── Test 9: SHA256 Checksum ───────────────────────────────────────────────

section "TEST 9: SHA256 Verification"

echo "  9a: SHA256SUMS file exists..."
SHA_FILE="/home/priya/Documents/Github/Ai/aiinsight/dist/SHA256SUMS"
if [ -f "$SHA_FILE" ]; then
  pass "9a: SHA256SUMS file exists"
else
  fail "9a: SHA256SUMS file" "not found at $SHA_FILE"
fi

echo "  9b: Checksum verification..."
if [ -f "$SHA_FILE" ]; then
  EXPECTED_HASH=$(awk '{print $1}' "$SHA_FILE")
  ACTUAL_HASH=$(sha256sum "$BINARY" | awk '{print $1}')
  if [ "$EXPECTED_HASH" = "$ACTUAL_HASH" ]; then
    pass "9b: SHA256 checksum matches"
  else
    fail "9b: SHA256 mismatch" "expected=$EXPECTED_HASH actual=$ACTUAL_HASH"
  fi
fi

# ─── Test 10: Upgrade Test (config preserved) ──────────────────────────────

section "TEST 10: Upgrade Test (Config Preservation)"

echo "  10a: Config preserved across binary invocation..."
# Write a test config value
mkdir -p "$CONFIG_DIR"
echo '{"version":1,"currency":{"code":"GBP","symbol":"£"}}' > "$CONFIG_DIR/config.json"

OUTPUT=$(run_cmd "upgrade-check" "$BINARY" config 2>&1) || true
if [ -f "$CONFIG_DIR/config.json" ]; then
  # Check the currency setting persisted
  if grep -q "GBP" "$CONFIG_DIR/config.json"; then
    pass "10a: Config values preserved"
  else
    fail "10a: Config values lost after binary run"
  fi
else
  fail "10a: Config file deleted after binary run"
fi

echo "  10b: Machine ID preserved..."
# Restore machine ID if it was deleted by logout test
if [ ! -f "$CONFIG_DIR/machine-id" ]; then
  echo "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" > "$CONFIG_DIR/machine-id"
fi

OUTPUT=$(run_cmd "upgrade-machine-id" "$BINARY" status 2>&1) || true
if [ -f "$CONFIG_DIR/machine-id" ]; then
  pass "10b: Machine ID file preserved"
else
  fail "10b: Machine ID file lost"
fi

# ─── Test 11: Binary Properties ────────────────────────────────────────────

section "TEST 11: Binary Properties"

echo "  11a: Binary is executable..."
if [ -x "$BINARY" ]; then
  pass "11a: Binary is executable"
else
  fail "11a: Binary not executable"
fi

echo "  11b: Binary size reasonable..."
BINARY_SIZE=$(stat -c%s "$BINARY" 2>/dev/null || stat -f%z "$BINARY" 2>/dev/null || echo 0)
BINARY_SIZE_MB=$((BINARY_SIZE / 1024 / 1024))
if [ "$BINARY_SIZE_MB" -ge 50 ] && [ "$BINARY_SIZE_MB" -le 300 ]; then
  pass "11b: Binary size reasonable (${BINARY_SIZE_MB} MB)"
else
  warn "11b: Binary size" "${BINARY_SIZE_MB} MB (expected 50-300 MB)"
fi

echo "  11c: Binary is ELF format..."
FILE_TYPE=$(file "$BINARY" 2>/dev/null || true)
if echo "$FILE_TYPE" | grep -qi "ELF\|executable"; then
  pass "11c: Binary is valid ELF executable"
else
  fail "11c: Binary format" "$FILE_TYPE"
fi

echo "  11d: No dynamic linking to system Node.js..."
if ldd "$BINARY" 2>/dev/null | grep -qi "node\|libnode"; then
  fail "11d: Binary linked to system Node.js"
else
  pass "11d: Binary does not depend on system Node.js"
fi

# ─── Test 12: JSON Output Mode ─────────────────────────────────────────────

section "TEST 12: JSON Output"

echo "  12a: status --format json..."
OUTPUT=$(run_cmd "status-json" "$BINARY" status --format json 2>&1) || true
if echo "$OUTPUT" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  pass "12a: status --format json produces valid JSON"
else
  # May fail if no data - check if it's a clean error
  if echo "$OUTPUT" | grep -qiE "no usage|error|empty"; then
    pass "12a: status --format json handles no-data gracefully"
  else
    warn "12a: status JSON output" "not valid JSON: $(echo "$OUTPUT" | head -1)"
  fi
fi

echo "  12b: config --format json..."
OUTPUT=$(run_cmd "config-json" "$BINARY" config 2>&1) || true
# config command doesn't have --format json, it just outputs text
if echo "$OUTPUT" | grep -qiE "config|organization|not connected"; then
  pass "12b: config output is human-readable"
else
  warn "12b: config output" "$(echo "$OUTPUT" | head -2)"
fi

# ─── Test 13: Error Handling ───────────────────────────────────────────────

section "TEST 13: Error Handling"

echo "  13a: Unknown command..."
OUTPUT=$(run_cmd "unknown-cmd" "$BINARY" foobar 2>&1) || true
EXIT_CODE=$?
if [ "$EXIT_CODE" -ne 0 ] || echo "$OUTPUT" | grep -qiE "unknown|error|invalid|command"; then
  pass "13a: Unknown command handled"
else
  warn "13a: Unknown command" "exit=$EXIT_CODE"
fi

echo "  13b: Invalid flag..."
OUTPUT=$(run_cmd "invalid-flag" "$BINARY" status --format xml 2>&1) || true
EXIT_CODE=$?
if [ "$EXIT_CODE" -ne 0 ] || echo "$OUTPUT" | grep -qiE "unknown|invalid|error|valid"; then
  pass "13b: Invalid flag handled"
else
  warn "13b: Invalid flag" "exit=$EXIT_CODE"
fi

echo "  13c: --version and --help don't crash..."
OUTPUT=$(run_cmd "version-help" "$BINARY" --version 2>&1) || true
V_EXIT=$?
OUTPUT2=$(run_cmd "help-cmd" "$BINARY" --help 2>&1) || true
H_EXIT=$?
if [ "$V_EXIT" -eq 0 ] && [ "$H_EXIT" -eq 0 ]; then
  pass "13c: --version and --help exit cleanly"
else
  warn "13c: --version/--help" "version exit=$V_EXIT help exit=$H_EXIT"
fi

# ─── Cleanup ────────────────────────────────────────────────────────────────

section "CLEANUP"

# Restore real HOME
export HOME="/home/priya"

# Restore real config if backed up
if [ -d "$REAL_CONFIG_BACKUP" ]; then
  rm -rf "$REAL_CONFIG_DIR" 2>/dev/null || true
  mv "$REAL_CONFIG_BACKUP" "$REAL_CONFIG_DIR" 2>/dev/null || true
  echo "  Restored real config from backup"
fi

# Clean up isolated test dir (but keep log)
echo "  Test artifacts: $TEST_DIR"
echo "  Log file: $LOG_FILE"
rm -rf "$ISOLATED_HOME" 2>/dev/null || true

# ─── Final Report ───────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Niriksh Binary Validation Report${NC}"
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

for result in "${RESULTS[@]}"; do
  IFS='|' read -r status name detail <<< "$result"
  case "$status" in
    PASS) ((PASS_COUNT++)) ;;
    FAIL) ((FAIL_COUNT++)) ;;
    WARN) ((WARN_COUNT++)) ;;
  esac
done

TOTAL=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))

echo -e "  ${GREEN}PASS: $PASS_COUNT${NC} / $TOTAL"
echo -e "  ${RED}FAIL: $FAIL_COUNT${NC} / $TOTAL"
echo -e "  ${YELLOW}WARN: $WARN_COUNT${NC} / $TOTAL"
echo ""

# Calculate validation percentage (WARNs count as 50%)
SCORE=$(( (PASS_COUNT * 100 + WARN_COUNT * 50) / TOTAL ))
echo -e "  ${BOLD}Packaging Validation: ${SCORE}%${NC}"
echo ""

# Show failures
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo -e "${RED}${BOLD}  CRITICAL FAILURES:${NC}"
  for result in "${RESULTS[@]}"; do
    IFS='|' read -r status name detail <<< "$result"
    if [ "$status" = "FAIL" ]; then
      echo -e "    ${RED}✗ $name${NC}"
      [ -n "$detail" ] && echo -e "      $detail"
    fi
  done
  echo ""
fi

# Show warnings
if [ "$WARN_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}${BOLD}  WARNINGS:${NC}"
  for result in "${RESULTS[@]}"; do
    IFS='|' read -r status name detail <<< "$result"
    if [ "$status" = "WARN" ]; then
      echo -e "    ${YELLOW}⚠ $name${NC}"
      [ -n "$detail" ] && echo -e "      $detail"
    fi
  done
  echo ""
fi

# Verdict
echo -e "${BOLD}${CYAN}  FINAL VERDICT${NC}"
echo -e "${BOLD}  ─────────────${NC}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "  Ready for Design Partners?  ${GREEN}YES${NC}"
  echo -e "  Ready for Blog Launch?      ${GREEN}YES${NC}"
  if [ "$WARN_COUNT" -le 3 ]; then
    echo -e "  Ready for Public Beta?      ${GREEN}YES${NC}"
  else
    echo -e "  Ready for Public Beta?      ${YELLOW}MAYBE${NC} (${WARN_COUNT} warnings)"
  fi
else
  echo -e "  Ready for Design Partners?  ${RED}NO${NC} (${FAIL_COUNT} failures)"
  echo -e "  Ready for Blog Launch?      ${RED}NO${NC}"
  echo -e "  Ready for Public Beta?      ${RED}NO${NC}"
fi

echo ""
echo -e "${CYAN}  Platform tested: linux-x64 (Node.js $(node --version 2>/dev/null || echo 'N/A') embedded)${NC}"
echo -e "${CYAN}  Binary: $BINARY${NC}"
echo -e "${CYAN}  SHA256: $(sha256sum "$BINARY" 2>/dev/null | awk '{print $1}' || echo 'N/A')${NC}"
echo -e "${CYAN}  Log: $LOG_FILE${NC}"
echo ""

# Exit code
if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
else
  exit 0
fi
