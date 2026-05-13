# Fixes Applied

Date: 2026-05-08

## Issues Addressed

1. Unsafe frontend production fallback
   - Issue: `src/shared/config/env.ts` used `https://ibrat-backend-hi7w.onrender.com` as a default when the API base URL env var was missing.
   - Fix: Updated frontend env templates and docs to use `VITE_API_BASE_URL`.
   - Files: `src/shared/config/env.ts`

2. Refresh token storage exposure
   - Issue: The frontend stored refresh tokens in `localStorage`, keeping them accessible across browser restarts.
   - Fix: Moved refresh token storage to `sessionStorage` in `src/shared/api/http.ts` and `src/features/auth/model/auth-store.ts`.
   - Files: `src/shared/api/http.ts`, `src/features/auth/model/auth-store.ts`

3. In-memory rate limiting unsafe for production
   - Issue: Backend still used in-memory rate limiting for public auth endpoints, which is unsafe in clustered production.
   - Fix: Added production/staging startup blocking in `src/common/guards/public-rate-limit.guard.ts` when `RATE_LIMIT_PROVIDER=memory` is configured.
   - Files: `d:\MyProjects\ibrat-backend\src\common\guards\public-rate-limit.guard.ts`, `d:\MyProjects\ibrat-backend\src\config\configuration.ts`

4. Duplicate backend bcrypt dependency
   - Issue: `ibrat-backend/package.json` included both `bcrypt` and `bcryptjs`, but only `bcryptjs` was used in code.
   - Fix: Removed unused `bcrypt` dependency and `@types/bcrypt` from `ibrat-backend/package.json`.
   - Files: `d:\MyProjects\ibrat-backend\package.json`

## Validation Results

- Frontend typecheck: PASSED (`npm run typecheck`)
- Frontend build: PASSED (`npm run build`)
- Frontend smoke static: PASSED (`npm run smoke:static`)
- Backend build: PASSED (`npm --prefix ../ibrat-backend run build`)
- Backend lint: COULD NOT VALIDATE due existing ESLint config error in `ibrat-backend/eslint.config.mjs`

## Remaining Risk

- Refresh tokens are now reduced to session-scoped storage, but refresh flow still uses request body transport rather than HttpOnly cookies.
- In-memory rate limiting is explicitly blocked in production, but full Redis migration is still recommended for clustered deployments.
