# AIInsight Installer Script for Windows (PowerShell)
# Downloads and installs the AIInsight CLI binary for Windows.
# Usage: irm https://raw.githubusercontent.com/getagentseal/codeburn/main/scripts/install.ps1 | iex
#
# Environment variables:
#   AIINSIGHT_VERSION     — Pin a specific version (default: latest)
#   AIINSIGHT_INSTALL_DIR — Install directory (default: $env:LOCALAPPDATA\AIInsight\bin)
#   DOWNLOAD_BASE_URL     — Override the download base URL

param(
    [string]$Version = $env:AIINSIGHT_VERSION,
    [string]$InstallDir = $env:AIINSIGHT_INSTALL_DIR,
    [string]$DownloadBase = $env:DOWNLOAD_BASE_URL
)

$ErrorActionPreference = "Stop"

# Defaults
if (-not $Version) { $Version = "latest" }
if (-not $InstallDir) { $InstallDir = Join-Path $env:LOCALAPPDATA "AIInsight\bin" }
if (-not $DownloadBase) { $DownloadBase = "https://releases.getagentseal.dev/codeburn" }

function Get-LatestVersion {
    $apiUrl = "https://api.github.com/repos/getagentseal/codeburn/releases/latest"
    $response = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing
    return $response.tag_name
}

function Install-AIInsight {
    # Resolve version
    if ($Version -eq "latest") {
        $resolvedVersion = Get-LatestVersion
        Write-Host "Latest version: $resolvedVersion"
    } else {
        $resolvedVersion = $Version
    }

    # Build download URL
    $url = "$DownloadBase/$resolvedVersion/aiinsight.exe"
    Write-Host "Downloading AIInsight $resolvedVersion..."

    # Create temp file
    $tmpFile = [System.IO.Path]::GetTempFileName()

    try {
        # Download
        Invoke-WebRequest -Uri $url -OutFile $tmpFile -UseBasicParsing

        # Verify checksum
        $sumsUrl = "$DownloadBase/$resolvedVersion/SHA256SUMS"
        try {
            $sumsContent = Invoke-WebRequest -Uri $sumsUrl -UseBasicParsing -ErrorAction Stop
            $expectedHash = ($sumsContent.Content -split '\s+')[0]
            $actualHash = (Get-FileHash -Path $tmpFile -Algorithm SHA256).Hash.ToLower()

            if ($expectedHash -ne $actualHash) {
                Write-Error "Checksum verification failed.`nExpected: $expectedHash`nGot: $actualHash"
                exit 1
            }
            Write-Host "Checksum verified."
        } catch {
            Write-Warning "Could not verify checksum (continuing anyway)."
        }

        # Install
        if (-not (Test-Path $InstallDir)) {
            New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
        }

        $destPath = Join-Path $InstallDir "aiinsight.exe"
        Move-Item -Path $tmpFile -Destination $destPath -Force
        Write-Host "Installed to: $destPath"

        # Add to PATH if not already there
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($currentPath -notlike "*$InstallDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$InstallDir", "User")
            $env:PATH = "$env:PATH;$InstallDir"
            Write-Host "Added $InstallDir to user PATH."
        }

        Write-Host ""
        Write-Host "AIInsight installed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Quick start:"
        Write-Host "  aiinsight login"
        Write-Host "  aiinsight sync"
    } catch {
        if (Test-Path $tmpFile) { Remove-Item $tmpFile -Force }
        Write-Error "Installation failed: $_"
        exit 1
    }
}

Install-AIInsight
