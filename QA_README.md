# QA Environment

This setup is isolated from production. It uses a local MongoDB container with database `ibrat_qa`.

## Files

- `docker-compose.qa.yml`: QA stack for MongoDB, backend, frontend, and seed profile.
- `../ibrat-backend/.env.qa.example`: backend QA environment template.
- `.env.qa.example`: frontend QA environment template.
- `scripts/smoke-live.mjs`: live API smoke checks.
- `scripts/smoke-static.mjs`: static role/API wiring checks.
- `reports/`: generated smoke reports, ignored by git.

## First Run

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

Static checks:

```bash
npm run smoke:static
```

Read-only live checks against QA:

```bash
$env:SMOKE_API_URL="http://localhost:3000"; npm run smoke:live
```

Mutating CRUD checks against QA only:

```bash
$env:SMOKE_API_URL="http://localhost:3000"; $env:SMOKE_MUTATE="true"; npm run smoke:live
```

Reports are written to:

- `reports/smoke-static.json`
- `reports/smoke-static.md`
- `reports/smoke-live.json`
- `reports/smoke-live.md`

## Production Safety

Do not set `SMOKE_MUTATE=true` against production.

Backend seed refuses production/staging writes unless `SEED_ALLOW_PRODUCTION=true`. In this QA compose setup, that flag is scoped only to the isolated `seed` service and local `ibrat_qa` database.

## Observability Hooks

Frontend emits:

- `ibrat:observability-ready`
- `ibrat:frontend-error`

These are integration points for Sentry or another provider. Set `VITE_SENTRY_DSN` when adding the provider SDK.

Backend emits structured request logs and propagates `X-Request-Id` in responses.
