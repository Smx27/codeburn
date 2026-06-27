# Install Agent

Platform-specific installation instructions for the Niriksh CLI agent.

## Requirements

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | 22+ |
| Supported AI coding tool | See [Providers](../providers/README.md) |
| Disk access to session files | Read-only |

### Platform Support

| Platform | Architecture | Status |
|----------|--------------|--------|
| macOS | Apple Silicon (arm64) | ✅ Supported |
| macOS | Intel (x64) | ✅ Supported |
| Linux | x64 | ✅ Supported |
| Linux | arm64 | ✅ Supported |
| Windows | x64 | ✅ Supported |

## macOS

### Curl Installer (Recommended)

```bash
curl -fsSL https://niriksh.titanbyte.in/install.sh | bash
```

### Verify Installation

```bash
niriksh --version
# Expected: niriksh v1.0.0 (or later)
```

### Optional: macOS Menubar App

```bash
niriksh menubar
```

This downloads and installs the native SwiftUI menubar app.

## Windows

### PowerShell Installer (Recommended)

```powershell
irm https://niriksh.titanbyte.in/install.ps1 | iex
```

### Verify Installation

```powershell
niriksh --version
```

## Linux

### Curl Installer (Recommended)

```bash
curl -fsSL https://niriksh.titanbyte.in/install.sh | bash
```

### Verify Installation

```bash
niriksh --version
```

## Node SEA (Single Executable Application)

Niriksh supports Node.js Single Executable Applications for environments without Node.js installed.

### Download

Download the latest SEA binary from [GitHub Releases](https://github.com/Smx27/codeburn/releases) or use the [Downloads Page](https://niriksh.titanbyte.in/downloads).

### Install

```bash
# macOS/Linux
chmod +x niriksh-sea
sudo mv niriksh-sea /usr/local/bin/niriksh

# Windows
# Move niriksh-sea.exe to a directory in your PATH
```

### Verify

```bash
niriksh --version
```

## Post-Installation: Connect Agent

After installation, connect your agent to your Niriksh Cloud organization:

```bash
niriksh login
```

Paste your API key when prompted. See [Getting Started](getting-started.md) for details.

## Updating

### Curl Installer

Re-run the install script:

```bash
curl -fsSL https://niriksh.titanbyte.in/install.sh | bash
```

## Uninstalling

### Curl Installer

```bash
rm /usr/local/bin/niriksh
```

### Remove Local Data

```bash
# Remove cache and config
rm -rf ~/.cache/niriksh
rm -rf ~/.config/niriksh
```

## Troubleshooting

### `niriksh: command not found`

The install location is not in your `PATH`.

**Add to PATH:**
```bash
export PATH="/usr/local/bin:$PATH"
```

### `Permission denied`

Avoid using `sudo` with npm. Instead, fix npm permissions:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### `better-sqlite3` build errors (Cursor support)

Cursor support requires native compilation. Ensure you have build tools:

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt install build-essential python3
```

**Windows:**
```powershell
npm install -g windows-build-tools
```

### Agent won't register

- Verify your API key is valid: **Settings → API Keys** in the dashboard
- Check network connectivity to `niriksh.titanbyte.in`
- Ensure the key hasn't been revoked

See [Troubleshooting](troubleshooting.md) for more solutions.

## Next Steps

- [Getting Started](getting-started.md) — Full walkthrough from signup to dashboard
- [CLI Reference](../cli/command-reference.md) — All CLI commands
- [Troubleshooting](troubleshooting.md) — Common issues and solutions
