# Agent Installation

Platform-specific installation instructions for the AiInsight CLI agent.

## Requirements

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | 20+ |
| Supported AI coding tool | See [Providers](../README.md#supported-providers) |
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

### Homebrew (Recommended)

```bash
# Add the tap
brew tap aiinsight/tap

# Install AiInsight
brew install aiinsight
```

### Curl Installer

```bash
curl -fsSL https://get.aiinsight.dev/install.sh | bash
```

### npm

```bash
npm install -g aiinsight
```

### Verify Installation

```bash
aiinsight --version
# Expected: aiinsight v0.9.12 (or later)
```

### Optional: macOS Menubar App

```bash
aiinsight menubar
```

This downloads and installs the native SwiftUI menubar app. See [README](../README.md#menu-bar) for details.

## Windows

### winget (Recommended)

```bash
winget install AIInsight.CLI
```

### PowerShell Installer

```powershell
irm https://get.aiinsight.dev/install.ps1 | iex
```

### npm

```bash
npm install -g aiinsight
```

### Verify Installation

```powershell
aiinsight --version
```

## Linux

### Curl Installer (Recommended)

```bash
curl -fsSL https://get.aiinsight.dev/install.sh | bash
```

### apt (Debian/Ubuntu)

```bash
# Add the repository
curl -fsSL https://repo.aiinsight.dev/gpg | sudo gpg --dearmor -o /usr/share/keyrings/aiinsight.gpg
echo "deb [signed-by=/usr/share/keyrings/aiinsight.gpg] https://repo.aiinsight.dev stable main" | sudo tee /etc/apt/sources.list.d/aiinsight.list

# Install
sudo apt update
sudo apt install aiinsight
```

### yum (RHEL/CentOS/Fedora)

```bash
sudo tee /etc/yum.repos.d/aiinsight.repo <<EOF
[aiinsight]
name=AiInsight
baseurl=https://repo.aiinsight.dev/rpm
enabled=1
gpgcheck=1
gpgkey=https://repo.aiinsight.dev/gpg
EOF

sudo yum install aiinsight
```

### npm

```bash
npm install -g aiinsight
```

### Verify Installation

```bash
aiinsight --version
```

## Post-Installation: Register Agent

After installation, register your agent with your AiInsight Cloud organization:

```bash
aiinsight register --key ai_live_xxxxx_your_enrollment_key
```

See [Getting Started](getting-started.md#step-5-register-agent) for details.

## Updating

### Homebrew

```bash
brew upgrade aiinsight
```

### npm

```bash
npm update -g aiinsight
```

### Curl Installer

Re-run the install script:

```bash
curl -fsSL https://get.aiinsight.dev/install.sh | bash
```

## Uninstalling

### Homebrew

```bash
brew uninstall aiinsight
# Optional: remove the tap
brew untap aiinsight/tap
```

### npm

```bash
npm uninstall -g aiinsight
```

### Curl Installer

```bash
rm ~/.local/bin/aiinsight
```

### Windows

```powershell
winget uninstall AIInsight.CLI
```

### Remove Local Data

```bash
# Remove cache and config
rm -rf ~/.cache/aiinsight
rm -rf ~/.config/aiinsight
```

## Troubleshooting

### `aiinsight: command not found`

The install location is not in your `PATH`.

**npm global bin:**
```bash
# Find the npm global bin directory
npm config get prefix
# Add the bin directory to your PATH
export PATH="$(npm config get prefix)/bin:$PATH"
```

**Homebrew:**
```bash
# Ensure Homebrew bin is in PATH
eval "$(/opt/homebrew/bin/brew shellenv)"  # Apple Silicon
eval "$(/usr/local/bin/brew shellenv)"     # Intel
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

- Verify your enrollment key is valid: **Settings → Agents** in the dashboard
- Check network connectivity to `api.aiinsight.dev`
- Ensure the key hasn't been revoked

See [Troubleshooting](troubleshooting.md) for more solutions.

## Next Steps

- [Getting Started](getting-started.md) — Full walkthrough from signup to dashboard
- [Organization Onboarding](organization-onboarding.md) — Configure your organization
- [Troubleshooting](troubleshooting.md) — Common issues and solutions
