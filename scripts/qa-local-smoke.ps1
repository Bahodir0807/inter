param(
  [switch]$Mutate,
  [string]$ApiUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
Push-Location (Resolve-Path -Path (Join-Path $PSScriptRoot ".."))
try {
  $env:SMOKE_API_URL = $ApiUrl
  $env:SMOKE_MUTATE = if ($Mutate) { "true" } else { "false" }
  npm.cmd run smoke:live
}
finally {
  Pop-Location
}
