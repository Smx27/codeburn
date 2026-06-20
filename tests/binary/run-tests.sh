#!/usr/bin/env bash

set -euo pipefail

WORK_DIR="${BINARY_TEST_WORK_DIR:-/tmp/aiinsight-binary-test}"
ARTIFACT_DIR="$WORK_DIR/artifacts"
HOME_DIR="$WORK_DIR/home"
REPORT_PATH="${BINARY_REPORT_PATH:-$WORK_DIR/binary-report.json}"
BINARY_NAME="aiinsight-linux-x64"
BINARY_PATH="$ARTIFACT_DIR/$BINARY_NAME"
SHA_PATH="$ARTIFACT_DIR/SHA256SUMS"
MOUNTED_BINARY_PATH="${AIINSIGHT_BINARY_PATH:-}"
MOUNTED_SHA_PATH="${AIINSIGHT_SHA_PATH:-}"

mkdir -p "$ARTIFACT_DIR" "$HOME_DIR"

RESULT_STARTUP="FAIL"
RESULT_STATUS="FAIL"
RESULT_DOCTOR="FAIL"
RESULT_PROVIDERS="FAIL"
RESULT_LOGIN="FAIL"
RESULT_CONFIG="FAIL"
RESULT_QUEUE="FAIL"
RESULT_CORRUPT="FAIL"
RESULT_LEAKAGE="FAIL"

STARTUP_OUTPUT=""
STATUS_OUTPUT=""
DOCTOR_OUTPUT=""
PROVIDERS_OUTPUT=""
LOGIN_OUTPUT=""
SYNC_OUTPUT=""
CORRUPT_OUTPUT=""
LEAKAGE_OUTPUT=""
CRITICAL_FAILURES=()

json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '"%s"' "$s"
}

fail_with() {
  local message="$1"
  CRITICAL_FAILURES+=("$message")
}

require_artifact() {
  if [[ -n "$MOUNTED_BINARY_PATH" && -n "$MOUNTED_SHA_PATH" ]]; then
    [[ -f "$MOUNTED_BINARY_PATH" ]] || {
      echo "Missing artifact: $MOUNTED_BINARY_PATH" >&2
      exit 1
    }
    [[ -f "$MOUNTED_SHA_PATH" ]] || {
      echo "Missing artifact: $MOUNTED_SHA_PATH" >&2
      exit 1
    }
    return
  fi

  if [[ ! -f "$PWD/dist/$BINARY_NAME" ]]; then
    echo "Missing artifact: $PWD/dist/$BINARY_NAME" >&2
    exit 1
  fi
  if [[ ! -f "$PWD/dist/SHA256SUMS" ]]; then
    echo "Missing artifact: $PWD/dist/SHA256SUMS" >&2
    exit 1
  fi
}

stage_artifacts() {
  local source_binary="${MOUNTED_BINARY_PATH:-$PWD/dist/$BINARY_NAME}"
  local source_sha="${MOUNTED_SHA_PATH:-$PWD/dist/SHA256SUMS}"
  cp "$source_binary" "$BINARY_PATH"
  cp "$source_sha" "$SHA_PATH"
  chmod +x "$BINARY_PATH"
}

run_cmd() {
  local output_file="$1"
  shift
  set +e
  HOME="$HOME_DIR" XDG_CONFIG_HOME="$HOME_DIR/.config" XDG_CACHE_HOME="$HOME_DIR/.cache" "$@" >"$output_file" 2>&1
  local code=$?
  set -e
  return "$code"
}

contains_runtime_failure() {
  local text="$1"
  grep -Eqi 'Cannot find module|Cannot find package|MODULE_NOT_FOUND|ERR_MODULE_NOT_FOUND|ReferenceError|SyntaxError|stack trace|Error:' <<<"$text"
}

record_simple_result() {
  local name="$1"
  local code="$2"
  local output="$3"
  if [[ "$code" -eq 0 ]] && ! contains_runtime_failure "$output"; then
    printf -v "$name" '%s' "PASS"
  else
    printf -v "$name" '%s' "FAIL"
    fail_with "$name failed: ${output//$'\n'/ | }"
  fi
}

test_startup() {
  echo "=== Test: Startup ==="
  local out="$WORK_DIR/startup.log"
  local code=0
  run_cmd "$out" "$BINARY_PATH" --version || code=$?
  STARTUP_OUTPUT="$(cat "$out" 2>/dev/null || true)"

  if [[ "$code" -ne 0 ]]; then
    RESULT_STARTUP="FAIL"
    fail_with "startup exit code: $code — ${STARTUP_OUTPUT//$'\n'/ | }"
    return
  fi

  if contains_runtime_failure "$STARTUP_OUTPUT"; then
    RESULT_STARTUP="FAIL"
    fail_with "startup runtime failure: ${STARTUP_OUTPUT//$'\n'/ | }"
    return
  fi

  if [[ -z "$STARTUP_OUTPUT" || "$STARTUP_OUTPUT" =~ ^[[:space:]]*$ ]]; then
    RESULT_STARTUP="FAIL"
    fail_with "startup produced no output"
    return
  fi

  RESULT_STARTUP="PASS"
  echo "  version output: $STARTUP_OUTPUT"
}

test_commands() {
  echo "=== Test: Commands ==="
  local out code

  out="$WORK_DIR/status.log"
  code=0
  run_cmd "$out" "$BINARY_PATH" status || code=$?
  STATUS_OUTPUT="$(cat "$out" 2>/dev/null || true)"
  record_simple_result RESULT_STATUS "$code" "$STATUS_OUTPUT"
  echo "  status: $RESULT_STATUS"

  out="$WORK_DIR/doctor.log"
  code=0
  run_cmd "$out" "$BINARY_PATH" doctor || code=$?
  DOCTOR_OUTPUT="$(cat "$out" 2>/dev/null || true)"
  record_simple_result RESULT_DOCTOR "$code" "$DOCTOR_OUTPUT"
  echo "  doctor: $RESULT_DOCTOR"

  out="$WORK_DIR/providers.log"
  code=0
  run_cmd "$out" "$BINARY_PATH" providers || code=$?
  PROVIDERS_OUTPUT="$(cat "$out" 2>/dev/null || true)"
  record_simple_result RESULT_PROVIDERS "$code" "$PROVIDERS_OUTPUT"
  echo "  providers: $RESULT_PROVIDERS"
}

test_login_and_config() {
  echo "=== Test: Config Lifecycle ==="
  local out="$WORK_DIR/login.log"
  local code=0
  mkdir -p "$HOME_DIR"
  set +e
  printf 'test-api-key\n' | HOME="$HOME_DIR" XDG_CONFIG_HOME="$HOME_DIR/.config" XDG_CACHE_HOME="$HOME_DIR/.cache" "$BINARY_PATH" login >"$out" 2>&1
  code=$?
  set -e
  LOGIN_OUTPUT="$(cat "$out" 2>/dev/null || true)"

  if [[ "$code" -eq 0 ]] && ! contains_runtime_failure "$LOGIN_OUTPUT"; then
    RESULT_LOGIN="PASS"
  else
    RESULT_LOGIN="FAIL"
    fail_with "login failed: ${LOGIN_OUTPUT//$'\n'/ | }"
  fi
  echo "  login: $RESULT_LOGIN"

  local config_dir="$HOME_DIR/.config/aiinsight"
  local missing=()
  [[ -f "$config_dir/config.json" ]] || missing+=("config.json")
  [[ -f "$config_dir/machine-id" ]] || missing+=("machine-id")
  [[ -d "$config_dir/sync-state" ]] || missing+=("sync-state")
  [[ -d "$config_dir/upload-queue" ]] || missing+=("upload-queue")
  [[ -d "$config_dir/logs" ]] || missing+=("logs")

  if [[ "${#missing[@]}" -eq 0 ]]; then
    RESULT_CONFIG="PASS"
  else
    RESULT_CONFIG="FAIL"
    fail_with "config lifecycle missing: ${missing[*]}"
  fi
  echo "  config: $RESULT_CONFIG"
}

test_corrupt_config() {
  echo "=== Test: Corrupt Config ==="
  local config_dir="$HOME_DIR/.config/aiinsight"
  local out="$WORK_DIR/corrupt.log"
  mkdir -p "$config_dir"
  printf '{invalid-json\n' >"$config_dir/config.json"
  local code=0
  run_cmd "$out" "$BINARY_PATH" doctor || code=$?
  CORRUPT_OUTPUT="$(cat "$out" 2>/dev/null || true)"

  if [[ "$code" -eq 0 ]] \
    && ! grep -Eqi 'SyntaxError|Unexpected token|crash|stack trace' <<<"$CORRUPT_OUTPUT" \
    && grep -Eqi 'config|configuration|login|corrupt|invalid|reset' <<<"$CORRUPT_OUTPUT"; then
    RESULT_CORRUPT="PASS"
  else
    RESULT_CORRUPT="FAIL"
    fail_with "corrupt config handling failed: ${CORRUPT_OUTPUT//$'\n'/ | }"
  fi
  echo "  corruptConfig: $RESULT_CORRUPT"
}

test_queue_recovery() {
  echo "=== Test: Queue Recovery ==="
  local out="$WORK_DIR/sync.log"
  local code=0
  run_cmd "$out" "$BINARY_PATH" sync || code=$?
  SYNC_OUTPUT="$(cat "$out" 2>/dev/null || true)"

  local queue_dir="$HOME_DIR/.config/aiinsight/upload-queue"
  if [[ -d "$queue_dir" ]]; then
    RESULT_QUEUE="PASS"
  else
    RESULT_QUEUE="FAIL"
    fail_with "queue directory missing after sync: ${SYNC_OUTPUT//$'\n'/ | }"
  fi
  echo "  queue: $RESULT_QUEUE"
}

test_source_tree_leakage() {
  echo "=== Test: Source Tree Leakage ==="
  LEAKAGE_OUTPUT="$STARTUP_OUTPUT"$'\n'"$STATUS_OUTPUT"$'\n'"$DOCTOR_OUTPUT"$'\n'"$PROVIDERS_OUTPUT"$'\n'"$LOGIN_OUTPUT"$'\n'"$SYNC_OUTPUT"

  local leaked=0
  local patterns=(
    'package\.json'
    'node_modules'
    '\.\./'
    '\.\./\.\./'
    'main\.js'
    'createRequire'
    '/cwd'
    'process\.cwd'
    'require\('
    '__dirname'
    '__filename'
  )

  for pat in "${patterns[@]}"; do
    if grep -Eqi "$pat" <<<"$LEAKAGE_OUTPUT"; then
      echo "  LEAKAGE DETECTED: pattern '$pat'"
      leaked=1
    fi
  done

  if [[ "$leaked" -eq 0 ]]; then
    RESULT_LEAKAGE="PASS"
  else
    RESULT_LEAKAGE="FAIL"
    fail_with "source tree leakage detected in runtime output"
  fi
  echo "  sourceTreeLeakage: $RESULT_LEAKAGE"
}

write_report() {
  local total=9
  local passed=0
  local value
  for value in "$RESULT_STARTUP" "$RESULT_STATUS" "$RESULT_DOCTOR" "$RESULT_PROVIDERS" "$RESULT_LOGIN" "$RESULT_CONFIG" "$RESULT_QUEUE" "$RESULT_CORRUPT" "$RESULT_LEAKAGE"; do
    [[ "$value" == "PASS" ]] && passed=$((passed + 1))
  done
  local binary_health=$(( passed * 100 / total ))
  local standalone="$binary_health"

  {
    printf '{\n'
    printf '  "startup": %s,\n' "$(json_escape "$RESULT_STARTUP")"
    printf '  "status": %s,\n' "$(json_escape "$RESULT_STATUS")"
    printf '  "doctor": %s,\n' "$(json_escape "$RESULT_DOCTOR")"
    printf '  "providers": %s,\n' "$(json_escape "$RESULT_PROVIDERS")"
    printf '  "login": %s,\n' "$(json_escape "$RESULT_LOGIN")"
    printf '  "config": %s,\n' "$(json_escape "$RESULT_CONFIG")"
    printf '  "queue": %s,\n' "$(json_escape "$RESULT_QUEUE")"
    printf '  "corruptConfig": %s,\n' "$(json_escape "$RESULT_CORRUPT")"
    printf '  "sourceTreeLeakage": %s,\n' "$(json_escape "$RESULT_LEAKAGE")"
    printf '  "binaryHealthPercent": %d,\n' "$binary_health"
    printf '  "standalonePercent": %d,\n' "$standalone"
    printf '  "criticalFailures": ['
    local i
    for i in "${!CRITICAL_FAILURES[@]}"; do
      [[ "$i" -gt 0 ]] && printf ', '
      printf '%s' "$(json_escape "${CRITICAL_FAILURES[$i]}")"
    done
    printf ']\n'
    printf '}\n'
  } >"$REPORT_PATH"

  echo ""
  echo "========================================"
  echo "  Binary Validation Report"
  echo "========================================"
  cat "$REPORT_PATH"
  echo "========================================"
  echo "  Binary Health: ${binary_health}%"
  echo "  Standalone:    ${standalone}%"
  echo "  Tests Passed:  ${passed}/${total}"
  if [[ "${#CRITICAL_FAILURES[@]}" -gt 0 ]]; then
    echo "  Critical Failures: ${#CRITICAL_FAILURES[@]}"
    for f in "${CRITICAL_FAILURES[@]}"; do
      echo "    - $f"
    done
  fi
  echo "========================================"
}

main() {
  rm -rf "$WORK_DIR"
  mkdir -p "$ARTIFACT_DIR" "$HOME_DIR"
  require_artifact
  stage_artifacts
  test_startup
  test_commands
  test_login_and_config
  test_corrupt_config
  test_queue_recovery
  test_source_tree_leakage
  write_report
}

main "$@"
