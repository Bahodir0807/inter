param(
  [switch]$Mutate,
  [string]$ApiUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
Push-Location (Resolve-Path -Path (Join-Path $PSScriptRoot ".."))
try {
  $env:SMOKE_API_BASE_URL = $ApiUrl
  $env:SMOKE_ALLOW_MUTATION = if ($Mutate) { "true" } else { "false" }
  $env:SMOKE_OWNER_USERNAME = "owner"
  $env:SMOKE_OWNER_PASSWORD = "ChangeMe123!"
  $env:SMOKE_ADMIN_USERNAME = "branch_admin"
  $env:SMOKE_ADMIN_PASSWORD = "ChangeMe123!"
  $env:SMOKE_TEACHER_USERNAME = "teacher"
  $env:SMOKE_TEACHER_PASSWORD = "ChangeMe123!"
  $env:SMOKE_STUDENT_USERNAME = "student"
  $env:SMOKE_STUDENT_PASSWORD = "ChangeMe123!"
  $env:SMOKE_PANDA_USERNAME = "panda"
  $env:SMOKE_PANDA_PASSWORD = "ChangeMe123!"
  npm.cmd run smoke:live
}
finally {
  Pop-Location
}
