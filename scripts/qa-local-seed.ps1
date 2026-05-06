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
  Write-Host "Created $envFile from example. Review MongoDB settings before seeding."
}

Push-Location $resolvedBackend
try {
  $env:NODE_ENV = "staging"
  $env:SEED_ALLOW_PRODUCTION = "true"
  npm.cmd run seed
}
finally {
  Pop-Location
}
