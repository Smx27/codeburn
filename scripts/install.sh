#!/usr/bin/env bash
# Niriksh Installer Script
# Downloads and installs the Niriksh CLI binary for the current platform.
# Usage: curl -fsSL https://niriksh.titanbyte.in/install.sh | bash
#
# Environment variables:
#   NIRIKSH_VERSION    — Pin a specific version (default: latest)
#   NIRIKSH_INSTALL_DIR — Install directory (default: /usr/local/bin)
#   DOWNLOAD_BASE_URL  — Override the download base URL

set -euo pipefail

DOWNLOAD_BASE="${DOWNLOAD_BASE_URL:-https://github.com/Smx27/codeburn/releases}"
INSTALL_DIR="${NIRIKSH_INSTALL_DIR:-/usr/local/bin}"
VERSION="${NIRIKSH_VERSION:-latest}"

# Detect platform and architecture
detect_platform() {
  local os arch

  case "$(uname -s)" in
    Linux*)   os="linux" ;;
    Darwin*)  os="darwin" ;;
    MINGW*|MSYS*|CYGWIN*)  os="win32" ;;
    *)
      echo "Error: Unsupported operating system: $(uname -s)" >&2
      exit 1
      ;;
  esac

  case "$(uname -m)" in
    x86_64|amd64)  arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *)
      echo "Error: Unsupported architecture: $(uname -m)" >&2
      exit 1
      ;;
  esac

  echo "${os}-${arch}"
}

# Get latest version from GitHub API
get_latest_version() {
  local api_url="https://api.github.com/repos/Smx27/codeburn/releases/latest"
  local version

  if command -v curl &>/dev/null; then
    version=$(curl -fsSL "$api_url" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
  elif command -v wget &>/dev/null; then
    version=$(wget -qO- "$api_url" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
  else
    echo "Error: Neither curl nor wget found. Please install one." >&2
    exit 1
  fi

  if [ -z "$version" ]; then
    echo "Error: Could not determine latest version." >&2
    exit 1
  fi

  echo "$version"
}

# Download and install
main() {
  local platform version url tmp_file

  platform=$(detect_platform)
  echo "Detected platform: ${platform}"

  if [ "$VERSION" = "latest" ]; then
    version=$(get_latest_version)
  else
    version="$VERSION"
  fi

  echo "Installing Niriksh ${version}..."

  # Determine filename based on platform
  case "$platform" in
    linux-x64|linux-arm64|darwin-x64|darwin-arm64)
      url="${DOWNLOAD_BASE}/download/niriksh-${platform}"
      ;;
    win32-*)
      url="${DOWNLOAD_BASE}/download/niriksh.exe"
      ;;
  esac

  echo "Downloading from: ${url}"

  tmp_file=$(mktemp)
  trap 'rm -f "$tmp_file"' EXIT

  if command -v curl &>/dev/null; then
    curl -fsSL "$url" -o "$tmp_file"
  elif command -v wget &>/dev/null; then
    wget -q "$url" -O "$tmp_file"
  else
    echo "Error: Neither curl nor wget found." >&2
    exit 1
  fi

  # Verify checksum if SHA256SUMS is available
  local sums_url="${DOWNLOAD_BASE}/download/SHA256SUMS"
  if command -v curl &>/dev/null; then
    curl -fsSL "$sums_url" -o "${tmp_file}.sha256" 2>/dev/null || true
  fi
  if [ -f "${tmp_file}.sha256" ]; then
    echo "Verifying checksum..."
    local expected_hash
    expected_hash=$(awk '{print $1}' "${tmp_file}.sha256")
    local actual_hash
    actual_hash=$(sha256sum "$tmp_file" | awk '{print $1}')
    if [ "$expected_hash" != "$actual_hash" ]; then
      echo "Error: Checksum verification failed." >&2
      echo "  Expected: $expected_hash" >&2
      echo "  Got:      $actual_hash" >&2
      exit 1
    fi
    echo "Checksum verified."
    rm -f "${tmp_file}.sha256"
  fi

  # Install
  mkdir -p "$INSTALL_DIR"
  mv "$tmp_file" "${INSTALL_DIR}/niriksh"
  chmod 755 "${INSTALL_DIR}/niriksh"
  trap - EXIT

  echo ""
  echo "Niriksh installed successfully to ${INSTALL_DIR}/niriksh"
  echo ""
  echo "Quick start:"
  echo "  niriksh login"
  echo "  niriksh sync"
  echo ""
}

main "$@"
