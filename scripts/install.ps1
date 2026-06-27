# Niriksh Installer Script for Windows (PowerShell)
# Downloads and installs the Niriksh CLI binary for Windows.
# Usage: irm https://niriksh.titanbyte.in/install.ps1 | iex
#
# Environment variables:
#   NIRIKSH_VERSION     — Pin a specific version (default: latest)
#   NIRIKSH_INSTALL_DIR — Install directory (default: $env:LOCALAPPDATA\Niriksh\bin)
#   DOWNLOAD_BASE_URL   — Override the download base URL

param(
    [string]$Version = $env:NIRIKSH_VERSION,
    [string]$InstallDir = $env:NIRIKSH_INSTALL_DIR,
    [string]$DownloadBase = $env:DOWNLOAD_BASE_URL
)

$ErrorActionPreference = "Stop"

# Defaults
if (-not $Version) { $Version = "latest" }
if (-not $InstallDir) { $InstallDir = Join-Path $env:LOCALAPPDATA "Niriksh\bin" }
if (-not $DownloadBase) { $DownloadBase = "https://github.com/Smx27/codeburn/releases" }

function Get-LatestVersion {
    $apiUrl = "https://api.github.com/repos/Smx27/codeburn/releases/latest"
    $response = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing
    return $response.tag_name
}

function Install-Niriksh {
    # Resolve version
    if ($Version -eq "latest") {
        $resolvedVersion = Get-LatestVersion
        Write-Host "Latest version: $resolvedVersion"
    } else {
        $resolvedVersion = $Version
    }

    # Build download URL
    $url = "$DownloadBase/download/niriksh.exe"
    Write-Host "Downloading Niriksh $resolvedVersion..."

    # Create temp file
    $tmpFile = [System.IO.Path]::GetTempFileName()

    try {
        # Download
        Invoke-WebRequest -Uri $url -OutFile $tmpFile -UseBasicParsing

        # Verify checksum
        $sumsUrl = "$DownloadBase/download/SHA256SUMS"
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

        $destPath = Join-Path $InstallDir "niriksh.exe"
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
        Write-Host "Niriksh installed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Quick start:"
        Write-Host "  niriksh login"
        Write-Host "  niriksh sync"
    } catch {
        if (Test-Path $tmpFile) { Remove-Item $tmpFile -Force }
        Write-Error "Installation failed: $_"
        exit 1
    }
}

Install-Niriksh
