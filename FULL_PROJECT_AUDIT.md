# Full Project Audit

Date: 2026-05-08

## Scope

This audit covers the frontend repository in `d:\MyProjects\frontе` and the backend repository in `d:\MyProjects\ibrat-backend` as they relate to QA, authentication, security, and production readiness.

## Summary

- Frontend static QA is in good shape: `npm run typecheck`, `npm run build`, and `npm run smoke:static` are all passing.
- Live QA has been hardened with clear verdicts, explicit credential handling, health preflight, and DTO leak detection.
- Backend architecture is sound for auth and role-based access, but a few operational/security risks remain.
- Production deployment must remain blocked until live QA completes successfully against a running seeded backend.

## Fixes Applied

- Removed unsafe `VITE_API_URL` production fallback in `src/shared/config/env.ts`.
- Moved refresh token storage from `localStorage` to `sessionStorage` in the frontend to reduce persistent token exposure.
- Added backend rate limiting production safety: in production/staging, the in-memory `PublicRateLimitGuard` now blocks startup unless `RATE_LIMIT_PROVIDER=redis` is configured.
- Removed unused backend dependency `bcrypt` and its type package from `ibrat-backend/package.json`.
- Validated frontend build, frontend typecheck, frontend static smoke, and backend build.
- Backend lint validation could not be completed due to an existing ESLint configuration error in `ibrat-backend/eslint.config.mjs`.

## Frontend Findings

### What is good

- `scripts/smoke-live.mjs` now requires explicit environment configuration and reports exactly when live QA is blocked.
- Added live QA verdicts: `passed`, `failed`, `blocked: backend unreachable`, and `blocked: credentials`.
- DTO leak detection is implemented for teacher and student responses, preventing accidental exposure of sensitive fields such as:
  - `password`, `hashedPassword`, `refreshToken`, `accessToken`, `token`
  - `email`, `phoneNumber`, `telegramId`
  - `_id`, `__v`, `deletedAt`
- `QA_README.md` now clearly separates static QA from live QA and documents the required flow.
- `qa-local-smoke.ps1` was updated to use explicit smoke variables and seeded credentials.
- `FINAL_AUDIT.md` was updated to make production readiness conditional on live QA passing.

### Code and security observations

- The frontend auth flow uses a persistent access token in `localStorage` and now stores the refresh token in `sessionStorage`.
  - This reduces refresh token persistence across browser restarts, lowering exposure compared to `localStorage`.
  - It is still not as safe as HttpOnly cookies, so a future migration is recommended.
- `src/shared/config/env.ts` previously fell back to `https://b.sultonoway.uz` when `VITE_API_URL` was missing.
  - This unsafe implicit production fallback has been removed.
  - The app now throws a clear error if `VITE_API_URL` is not provided.
- `src/shared/api/http.ts` uses `axios.defaults.withCredentials = false`, which is appropriate for token-based auth.
- Route protection via `ProtectedRoute` and `RoleGate` is useful for UI gating, but backend enforcement is the true security boundary.

## Backend Findings

### What is good

- Authentication is implemented with JWT bearer tokens and refresh tokens.
- Password hashing uses `bcryptjs` with `SALT_ROUNDS = 12`.
- `RolesGuard` and `JwtAuthGuard` are in place to protect endpoints.
- A health endpoint exists and is used by the frontend QA harness.
- Global exception filtering hides stack traces in production-like environments.
- Environment validation uses Joi and includes explicit production safety checks.
- Seeding requires `SEED_ALLOW_PRODUCTION=true` when `NODE_ENV=production`, which is a good safety control.

### Operational and security concerns

- Public rate limiting is implemented with an in-memory bucket map.
  - This works only per process and is not sufficient for multi-instance or clustered production deployments.
  - The backend now blocks production and staging startup when this in-memory limiter is still configured, requiring `RATE_LIMIT_PROVIDER=redis` to proceed.
  - Consider migrating rate limiting to Redis or another shared store for production.
- The backend installed both `bcrypt` and `bcryptjs`.
  - This redundancy has been cleaned up by removing the unused `bcrypt` dependency from `package.json`.
- CORS origins are configured via environment variables, which is good, but verify that production and QA values are locked down appropriately.
- `verifyPassword()` and token refresh are implemented correctly, but refresh tokens are still carried in request bodies rather than HttpOnly cookies.
  - This is consistent with the frontend design but is a security tradeoff.

## QA and Release Readiness

### Current status

- Static QA: PASSED
- Live QA: NOT YET EXECUTED against a running seeded backend
- Production readiness: BLOCKED until live QA passes

### Required actions before production

1. Start the QA backend and ensure it is seeded with known test users.
2. Run live QA with explicit smoke credentials using `npm run smoke:live`.
3. Confirm the result is `passed`.
4. Fix any live QA failures before declaring production readiness.

### Recommended follow-ups

- Fix the frontend `VITE_API_URL` fallback so missing env does not silently target production.
- Consider migrating refresh token storage to HttpOnly cookies for stronger security.
- Replace the backend in-memory rate limiter with a shared store for production.
- Remove duplicate bcrypt-related dependencies if only one is needed.

## Verdict

- Frontend static validation is solid.
- Live QA improvements are complete and enforce a strict gating model.
- Backend auth and guards are well structured, but operational hardening is needed for a production-grade deployment.
- Production should remain blocked until the live QA path is executed and passes in the actual QA environment.

## Files referenced

- `scripts/smoke-live.mjs`
- `scripts/qa-local-smoke.ps1`
- `QA_README.md`
- `FINAL_AUDIT.md`
- `src/shared/config/env.ts`
- `src/shared/api/http.ts`
- `d:\MyProjects\ibrat-backend\src\common\password.ts`
- `d:\MyProjects\ibrat-backend\src\common\guards\roles.guard.ts`
- `d:\MyProjects\ibrat-backend\src\common\filters\all-exceptions.filter.ts`
- `d:\MyProjects\ibrat-backend\scripts\seed.ts`
