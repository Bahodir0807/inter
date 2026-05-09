# Deploy Checklist

Use this checklist for the final production deploy. Do not run seed scripts against production unless a deliberate initial data load has been approved.

## Backend Environment

- [ ] `NODE_ENV=production`.
- [ ] `PORT` is set by the host or configured explicitly.
- [ ] API base path and route prefixes match frontend expectations.
- [ ] Required config validation passes at startup.
- [ ] Logs are available in the hosting provider dashboard.
- [ ] Health endpoints are reachable after deploy.

## Frontend Environment

- [ ] Production frontend env points to the deployed backend API URL.
- [ ] No local QA or localhost API URL is present in the deployed build.
- [ ] Build command has been run from the frontend project: `npm.cmd run build`.
- [ ] Upload or publish uses the current `dist` output.
- [ ] SPA fallback/rewrite is configured so protected routes refresh correctly.

## Mongo Atlas URI

- [ ] `MONGODB_URI` uses the production Atlas cluster.
- [ ] Database user has the minimum required permissions.
- [ ] Atlas network access allows the backend host.
- [ ] Connection string does not contain development database names.
- [ ] Credentials are stored only in environment variables or host secrets.

## CORS

- [ ] Backend CORS allows the exact production frontend origin.
- [ ] Backend CORS allows the QA origin only if QA is intentionally active.
- [ ] Wildcard CORS is not used for production credentials.
- [ ] Browser login and authenticated requests succeed from the deployed frontend domain.

## JWT Secrets

- [ ] JWT access secret is strong and production-only.
- [ ] JWT refresh secret, if used, is strong and production-only.
- [ ] Secrets are not committed to Git.
- [ ] Token expiration settings match operational requirements.
- [ ] Rotate secrets if they were ever used in a shared QA/demo environment.

## Render Backend Settings

- [ ] Root directory points to the backend project.
- [ ] Build command: `npm.cmd run build` or platform-equivalent `npm run build`.
- [ ] Start command: `npm.cmd run start:prod` or platform-equivalent `npm run start:prod`.
- [ ] Required environment variables are set in Render.
- [ ] Health check path points to the backend health endpoint, for example `/health/ready`.
- [ ] Auto-deploy branch is correct.
- [ ] Instance type is appropriate for expected traffic.

## Frontend Hosting Upload

- [ ] Run frontend validation before upload.
- [ ] Run `npm.cmd run build`.
- [ ] Upload the contents of `dist`, not the project root.
- [ ] Configure SPA fallback to `index.html`.
- [ ] Confirm deployed `index.html` references current hashed assets.
- [ ] Hard refresh the deployed site and verify login page loads.
- [ ] Confirm protected route refresh works, for example `/app/dashboard`.

## Health Endpoint

- [ ] `/health/live` returns success.
- [ ] `/health/ready` returns success.
- [ ] `/version` or equivalent version endpoint returns expected deployed version if enabled.
- [ ] Failed database connectivity changes readiness status.

## Live Smoke QA

- [ ] Copy `.env.smoke.example` to `.env.smoke` locally or set equivalent environment variables.
- [ ] Fill `SMOKE_API_BASE_URL` with the deployed backend URL.
- [ ] Fill owner, admin, teacher, student, and panda credentials.
- [ ] Keep `SMOKE_ALLOW_MUTATION=false` for production.
- [ ] Run readonly live smoke: `npm.cmd run smoke:live`.
- [ ] Only run mutating smoke against QA with `SMOKE_ALLOW_MUTATION=true`.
- [ ] Review generated reports in `reports/`.

## Seed Warning

- [ ] Do not run seed scripts on production after launch.
- [ ] If initial production seed is required, back up the database first.
- [ ] Confirm seed data does not include QA passwords or demo-only records.
- [ ] Record who approved the seed and when it was run.

## Backup Note

- [ ] Confirm Atlas automated backups are enabled.
- [ ] Take a manual backup before production mutations, migrations, or seed operations.
- [ ] Verify restore procedure is documented and accessible.
- [ ] Confirm backup retention meets business requirements.

## Rollback Note

- [ ] Keep the previous backend deploy available for rollback.
- [ ] Keep the previous frontend `dist` artifact or hosting version available.
- [ ] Document the rollback trigger: failed health, failed login, failed role access, data corruption, or critical UI outage.
- [ ] After rollback, run health checks and readonly live smoke again.
- [ ] Record rollback time, version, reason, and owner.

## Final Go/No-Go

- [ ] Backend automated validation passed.
- [ ] Frontend automated validation passed.
- [ ] Readonly live smoke passed against the target backend.
- [ ] Manual browser QA passed for owner/admin, teacher, and student.
- [ ] Production environment checklist passed.
- [ ] Deployment owner approved release.
