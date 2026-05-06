param(
  [string]$BackendPath = "..\ibrat-backend"
)

$ErrorActionPreference = "Stop"
$resolvedBackend = Resolve-Path -Path (Join-Path $PSScriptRoot $BackendPath)
$envFile = Join-Path $resolvedBackend ".env.staging.local"
$exampleFile = Join-Path $resolvedBackend ".env.staging.local.example"

if (-not (Test-Path $envFile)) {
  if (-not (Test-Path $exampleFile)) {
    throw "Missing $exampleFile"
  }
  Copy-Item $exampleFile $envFile
  Write-Host "Created $envFile from example. Review MongoDB settings before using real QA data."
}

Push-Location $resolvedBackend
try {
  $env:NODE_ENV = "staging"
  $env:BUILD_HASH = if ($env:BUILD_HASH) { $env:BUILD_HASH } else { "qa-local" }
  $env:BUILD_TIME = (Get-Date).ToUniversalTime().ToString("o")
  npm.cmd run start:dev
}
finally {
  Pop-Location
}
