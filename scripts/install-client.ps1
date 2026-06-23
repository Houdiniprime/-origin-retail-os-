param(
  [switch]$NoLaunch,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Launcher = Join-Path $ProjectDir "OriginRetailOS.exe"
$InstallLog = Join-Path $ProjectDir "data\install-client.log"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "== $Message" -ForegroundColor Cyan
  if (-not $DryRun) {
    New-Item -ItemType Directory -Force -Path (Split-Path $InstallLog) | Out-Null
    Add-Content -Path $InstallLog -Value "[$(Get-Date -Format s)] $Message"
  }
}

function Test-Command($Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Test-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Ensure-Admin-If-Needed {
  if ($DryRun) { return }
  if (Test-Command "node.exe") { return }
  if (Test-Admin) { return }
  Write-Step "Elevation administrateur requise pour installer Node.js"
  $args = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$PSCommandPath`""
  )
  if ($NoLaunch) { $args += "-NoLaunch" }
  Start-Process -FilePath "powershell.exe" -ArgumentList $args -Verb RunAs -WorkingDirectory $ProjectDir
  exit 0
}

function Install-Node {
  if (Test-Command "node.exe" -and Test-Command "npm.cmd") {
    Write-Step "Node.js deja installe"
    node --version
    npm --version
    return
  }

  Write-Step "Installation automatique de Node.js LTS"
  if ($DryRun) {
    Write-Host "DRY RUN: installation Node.js ignoree"
    return
  }

  if (Test-Command "winget.exe") {
    Write-Step "Installation via winget"
    winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
  } else {
    Write-Step "Installation via MSI officiel Node.js"
    $index = Invoke-WebRequest -Uri "https://nodejs.org/dist/latest-v22.x/" -UseBasicParsing
    $msiName = ([regex]::Match($index.Content, "node-v[\d\.]+-x64\.msi")).Value
    if (-not $msiName) { throw "Impossible de detecter le MSI Node.js LTS." }
    $msiUrl = "https://nodejs.org/dist/latest-v22.x/$msiName"
    $msiPath = Join-Path $env:TEMP $msiName
    Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath -UseBasicParsing
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$msiPath`" /qn /norestart" -Wait
  }

  $nodePath = Join-Path $env:ProgramFiles "nodejs"
  if (Test-Path $nodePath) {
    $env:Path = "$nodePath;$env:Path"
  }
  if (-not (Test-Command "node.exe")) { throw "Node.js n'est pas disponible apres installation." }
}

function Install-Dependencies {
  Write-Step "Installation des dependances ERP"
  Push-Location $ProjectDir
  try {
    if ($DryRun) {
      Write-Host "DRY RUN: npm install ignore"
    } else {
      npm.cmd install
    }
  } finally {
    Pop-Location
  }
}

function Create-Desktop-Shortcut {
  Write-Step "Creation du raccourci bureau"
  if ($DryRun) {
    Write-Host "DRY RUN: raccourci bureau ignore"
    return
  }
  if (-not (Test-Path $Launcher)) { throw "Lanceur introuvable: $Launcher" }
  $desktop = [Environment]::GetFolderPath("Desktop")
  $shortcutPath = Join-Path $desktop "Origin Retail OS.lnk"
  $wsh = New-Object -ComObject WScript.Shell
  $shortcut = $wsh.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $Launcher
  $shortcut.WorkingDirectory = $ProjectDir
  $shortcut.Description = "Lancer Origin Retail OS"
  $shortcut.Save()
  Write-Host "Raccourci cree: $shortcutPath" -ForegroundColor Green
}

function Verify-Project {
  Write-Step "Verification du projet"
  Push-Location $ProjectDir
  try {
    if ($DryRun) {
      npm.cmd run check
    } else {
      npm.cmd run check
      npm.cmd test
    }
  } finally {
    Pop-Location
  }
}

function Start-Erp {
  if ($NoLaunch -or $DryRun) { return }
  Write-Step "Lancement de Origin Retail OS"
  Start-Process -FilePath $Launcher -WorkingDirectory $ProjectDir
}

Write-Host "Origin Retail OS - Installation client" -ForegroundColor Yellow
Write-Host "Dossier: $ProjectDir"

Ensure-Admin-If-Needed
Install-Node
Install-Dependencies
Create-Desktop-Shortcut
Verify-Project
Start-Erp

Write-Host ""
Write-Host "Installation terminee." -ForegroundColor Green
Write-Host "Le client peut lancer l'application via le raccourci bureau: Origin Retail OS"
