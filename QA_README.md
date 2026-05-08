# QA Environment

This setup is isolated from production. There are two supported paths:

1. Docker QA
2. Non-Docker local QA

## Files

- `docker-compose.qa.yml`: QA stack for MongoDB, backend, frontend, and seed profile.
- `../ibrat-backend/.env.qa.example`: backend QA environment template.
- `../ibrat-backend/.env.staging.local.example`: backend non-Docker QA template.
- `.env.qa.example`: frontend QA environment template.
- `scripts/smoke-live.mjs`: live API smoke checks.
- `scripts/smoke-static.mjs`: static role/API wiring checks.
- `reports/`: generated smoke reports, ignored by git.

## Option 1: Docker QA

Prerequisite:

- Docker Desktop or Docker Engine with `docker compose` available in `PATH`.

Create env files from templates:

```bash
copy ..\ibrat-backend\.env.qa.example ..\ibrat-backend\.env.qa
copy .env.qa.example .env.qa
```

Start QA stack:

```bash
docker compose -f docker-compose.qa.yml up --build
```

Seed isolated QA data:

```bash
docker compose -f docker-compose.qa.yml --profile seed run --rm seed
```

Equivalent npm shortcuts:

```bash
npm run qa:up
npm run qa:seed
```

Seed users:

| Role | Username | Password |
|---|---|---|
| owner | owner | ChangeMe123! |
| admin | branch_admin | ChangeMe123! |
| panda | panda | ChangeMe123! |
| teacher | teacher | ChangeMe123! |
| student | student | ChangeMe123! |

## Smoke Tests

### QA Status Definitions

**Static QA** validates frontend role routing and endpoint guards without requiring a running backend:
- `npm run smoke:static` - Pass/fail on code alone

**Live QA** validates role endpoint access and data isolation against a running backend:
- `npm run smoke:live` - Requires running backend and valid credentials
- Must pass before production deployment

### Setup Credentials

Copy `.env.smoke.example` to `.env.smoke` and fill in the required values:

```bash
cp .env.smoke.example .env.smoke
```

For QA environment, use the seeded users listed above.

For staging/live readonly checks, obtain credentials from the environment or team.

**Never hardcode production credentials in code or commit real credentials.**

### Static Checks (No Backend Required)

```bash
npm run smoke:static
```

Result: Pass or fail on frontend code validation only.

### Live Checks (Requires Running Backend)

Before running live smoke, ensure the QA backend is running and seeded.

Load environment variables from `.env.smoke`:

```bash
# Linux/Mac
source .env.smoke
npm run smoke:live

# Windows PowerShell
. .\.env.smoke
npm run smoke:live
```

Or set inline:

Read-only live checks against QA:

```bash
$env:SMOKE_API_BASE_URL="http://localhost:3000"; npm run smoke:live
```

Mutating CRUD checks against QA only:

```bash
$env:SMOKE_API_BASE_URL="http://localhost:3000"; $env:SMOKE_ALLOW_MUTATION="true"; npm run smoke:live
```

Read-only checks against staging/live:

```bash
$env:SMOKE_API_BASE_URL="https://staging-api.example.com"; npm run smoke:live
```

**WARNING: Never set `SMOKE_ALLOW_MUTATION=true` against production or staging. This will perform destructive operations.**

#### Live Smoke Results

The smoke test will report one of:
- `passed` - All role tests passed, data isolation verified, DTO leak checks passed.
- `failed` - One or more role tests failed. See report for details.
- `blocked: backend unreachable` - Backend is not running or not reachable at the configured URL.
- `blocked: credentials` - One or more role credentials are invalid (401). Check credentials and backend users.

If credentials are missing, the smoke test will fail with a clear message listing required env vars.

Reports are written to:

- `reports/smoke-static.json`
- `reports/smoke-static.md`
- `reports/smoke-live-readonly.json`
- `reports/smoke-live-readonly.md`
- `reports/smoke-live-mutating.json`
- `reports/smoke-live-mutating.md`

## Production Safety

Do not set `SMOKE_ALLOW_MUTATION=true` against production or staging.

Backend seed refuses production/staging writes unless `SEED_ALLOW_PRODUCTION=true`. In this QA compose setup, that flag is scoped only to the isolated `seed` service and local `ibrat_qa` database.

Smoke tests will refuse mutations against URLs containing 'sultonoway.uz' or 'production' as an extra safeguard.

## Option 2: Non-Docker Local QA

Use this path when Docker is not available. It requires either:

- local MongoDB running on `mongodb://localhost:27017`, or
- a MongoDB Atlas QA database.

Backend env:

```bash
copy ..\ibrat-backend\.env.staging.local.example ..\ibrat-backend\.env.staging.local
```

Edit `..\ibrat-backend\.env.staging.local`:

- For local MongoDB, keep:
  - `MONGO_URI=mongodb://localhost:27017`
  - `MONGO_DB_NAME=ibrat_qa`
- For Atlas QA, set:
  - `MONGO_URI=mongodb+srv://...`
  - `MONGO_DB_NAME=ibrat_qa`

Start backend:

```bash
npm run qa:local:backend
```

This runs backend from `..\ibrat-backend` with:

- `NODE_ENV=staging`
- env loaded from `..\ibrat-backend\.env.staging.local`
- `npm run start:dev`

Seed isolated QA data:

```bash
npm run qa:local:seed
```

Run frontend in another terminal if needed:

```bash
npm run dev
```

Read-only smoke against local backend:

```bash
npm run qa:local:smoke
```

Mutating CRUD smoke against local QA backend only:

```bash
npm run qa:local:smoke:mutate
```

Direct PowerShell equivalents:

```bash
powershell -ExecutionPolicy Bypass -File scripts/qa-local-backend.ps1
powershell -ExecutionPolicy Bypass -File scripts/qa-local-seed.ps1
powershell -ExecutionPolicy Bypass -File scripts/qa-local-smoke.ps1
powershell -ExecutionPolicy Bypass -File scripts/qa-local-smoke.ps1 -Mutate
```

## Observability Hooks

Frontend emits:

- `ibrat:observability-ready`
- `ibrat:frontend-error`

These are integration points for Sentry or another provider. Set `VITE_SENTRY_DSN` when adding the provider SDK.

Backend emits structured request logs and propagates `X-Request-Id` in responses.
