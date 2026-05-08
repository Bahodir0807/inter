# QA Improvements Summary

Date: 2026-05-08

## Overview

Completed final QA gap fixes to ensure live QA validation is strict, clear, and blocks production claims until real backend testing passes.

## Changes Made

### 1. DTO Leak Detection Added to smoke-live.mjs

**New Functions:**
- `sensitiveFields`: List of fields that should never appear in responses for teacher/student roles:
  - `password`, `hashedPassword`, `refreshToken`, `accessToken`, `token`
  - `email`, `phoneNumber`, `telegramId`
  - `_id`, `__v`, `deletedAt` (internal MongoDB fields)

- `findSensitiveFieldsInObject(obj, path, visited)`: Recursively scans response objects for sensitive field names
  - Case-insensitive matching
  - Tracks visited objects to prevent infinite loops
  - Returns list of field paths that violate security rules

- `checkDtoLeaks(role, path, responseBody)`: Validates teacher/student responses
  - Called after every successful endpoint for these roles
  - Throws error if sensitive data is found
  - Prevents data leakage from production

**Integration:**
- `expectOk()` now calls `checkDtoLeaks()` for teacher/student responses
- Failures block test execution with clear error message

### 2. Backend Availability Preflight Added

**New Function:**
- `checkHealth()`: Calls `/health` endpoint to verify backend is running
  - Records pass/fail result
  - Returns boolean
  - Fails gracefully without throwing on first attempt

**Integration in run():**
- Health check runs before any role tests
- If health check fails, throws: `QA backend is not running or not reachable`
- Prevents confusing auth failures when backend is down

### 3. Strict Verdict Logic Implemented

**Verdict Categories:**
- `passed` - All role tests passed, data isolation verified, DTO checks passed
- `failed` - One or more test assertions failed
- `blocked: backend unreachable` - Health check failed or network error
- `blocked: credentials` - One or more role logins returned 401

**Logic in run():**
```javascript
let anyLoginFailed = false;
for (const role of Object.keys(credentials)) {
  const token = await login(role);
  if (token) {
    // ... run tests
  } else {
    anyLoginFailed = true;
  }
}
if (anyLoginFailed) {
  throw new Error('Live QA blocked by credentials...');
}
```

**Error Handler:**
```javascript
run().catch((error) => {
  let verdict = 'failed';
  if (errorMsg.includes('not running or not reachable')) {
    verdict = 'blocked: backend unreachable';
  } else if (errorMsg.includes('blocked by credentials')) {
    verdict = 'blocked: credentials';
  }
  // ... record and report
});
```

**Success Handler:**
- Only outputs "Live QA Result: passed" if code reaches `beforeExit` with exit code 0
- Prevents false "production-ready" claims

### 4. QA_README.md Updated

**New Sections:**

#### QA Status Definitions
- **Static QA**: Validation on code alone, no backend required
  - `npm run smoke:static`
  - Pass/fail indicates frontend code quality
  
- **Live QA**: Requires running backend with valid credentials
  - `npm run smoke:live`
  - Must pass before production deployment

#### Live Smoke Results
Documented possible outcomes:
- `passed` - All role tests passed
- `failed` - One or more tests failed
- `blocked: backend unreachable` - Backend not running/reachable
- `blocked: credentials` - Invalid role credentials (401)

#### Setup Instructions
- Separated static vs live flows
- Clear warnings about production mutation rules
- Emphasized that live QA is required pre-deployment

### 5. FINAL_AUDIT.md Updated

**New Section: Production Readiness Status**

```markdown
### Static QA: PASSED
- npm run typecheck: Passed
- npm run build: Passed
- npm run smoke:static: Passed

### Live QA: NOT EXECUTED
- Live role walkthrough requires running QA backend with seeded users
- Before declaring production-ready, run:
  npm run qa:up && npm run qa:seed && npm run qa:local:smoke

### Verdict: BLOCKED
Static QA passes. Live QA must pass before production deployment.
```

**Rationale:**
- Prevents accidental "production-ready" claims
- Documents exact steps required
- Clear tracking of what blocks deployment

### 6. qa-local-smoke.ps1 Updated

Updated script to set all required smoke env vars:
- `SMOKE_API_BASE_URL` (instead of old `SMOKE_API_URL`)
- `SMOKE_ALLOW_MUTATION` (instead of old `SMOKE_MUTATE`)
- All 12 role credentials with seeded defaults
- `-Mutate` flag still works as before

## Validation Results

### Static QA (No Backend Required)
✅ `npm run smoke:static`: **PASSED**
- Route roles validated
- Endpoint guards checked
- Pagination meta verified
- Error envelope structure verified

✅ `npm run build`: **PASSED**
- 284 modules transformed
- No build errors
- Total size: 255KB uncompressed

✅ `npm run typecheck`: **PASSED**
- No type errors
- All types verified

### Live QA Testing (With Blocked Backend)

**Test 1: Missing Environment Variables**
```bash
npm run smoke:live
```
❌ Result: `Live QA Result: failed`
- Message: Lists all 12 missing required env vars
- Message: Suggests copying `.env.smoke.example`

**Test 2: Backend Unreachable (Health Check Fails)**
```bash
SMOKE_API_BASE_URL=http://localhost:9999 [all creds] npm run smoke:live
```
✅ Result: `Live QA Result: blocked: backend unreachable`
- Health check ran first
- Clear message: "QA backend is not running or not reachable"
- Report status: `blocked: backend unreachable`
- Health check failure recorded in results

**Sample Report Output:**
```json
{
  "type": "live-smoke",
  "status": "blocked: backend unreachable",
  "apiUrl": "http://localhost:9999",
  "mutate": false,
  "results": [
    {
      "name": "backend health check",
      "status": "failed",
      "detail": "fetch failed"
    },
    {
      "name": "live smoke verdict",
      "status": "blocked: backend unreachable",
      "detail": "QA backend is not running or not reachable"
    }
  ]
}
```

## Features Implemented

### DTO Leak Detection
- ✅ Scans all teacher/student responses for sensitive fields
- ✅ Recursive object traversal with cycle detection
- ✅ Case-insensitive field name matching
- ✅ Clear error reporting with field paths
- ✅ Blocks test on first leak detected

### Health Check Preflight
- ✅ Calls `/health` before role tests
- ✅ Fails gracefully with clear message
- ✅ Records health status in results
- ✅ Prevents credential/auth confusion

### Strict Verdicts
- ✅ Backend unreachable → "blocked: backend unreachable"
- ✅ Credentials invalid → "blocked: credentials"
- ✅ Test failure → "failed"
- ✅ All tests pass → "passed"
- ✅ No false "production-ready" claims

### Documentation Clarity
- ✅ QA_README distinguishes Static vs Live
- ✅ FINAL_AUDIT shows blocked status
- ✅ Clear steps to unlock production readiness
- ✅ Warnings on mutating against production

## Files Changed

1. **scripts/smoke-live.mjs**
   - Added `sensitiveFields` constant
   - Added `findSensitiveFieldsInObject()` function
   - Added `checkDtoLeaks()` function
   - Added `checkHealth()` function
   - Updated `expectOk()` to call leak detection
   - Updated `run()` with health check preflight
   - Updated `run()` with strict credential failure tracking
   - Updated error handler with verdict classification
   - Updated success handler with clear messaging

2. **scripts/qa-local-smoke.ps1**
   - Updated env var names (SMOKE_API_BASE_URL, SMOKE_ALLOW_MUTATION)
   - Added all 12 role credentials with seeded defaults

3. **QA_README.md**
   - Added QA Status Definitions section
   - Separated Static QA from Live QA flows
   - Added Live Smoke Results documentation
   - Updated setup instructions with warnings
   - Emphasized live QA requirement for production

4. **FINAL_AUDIT.md**
   - Added Production Readiness Status section
   - Changed verdict from implicit to explicit "BLOCKED"
   - Documented steps to unlock production readiness

5. **.env.smoke.example** (previously created)
   - Includes all 12 role credentials
   - Includes SMOKE_ALLOW_MUTATION flag
   - Includes SMOKE_API_BASE_URL

## Production Readiness Criteria

**BLOCKED Until:**
- [ ] QA backend is running and reachable
- [ ] All seeded QA users exist with correct credentials
- [ ] `npm run smoke:live` returns verdict: `passed`
- [ ] Report shows all role tests passed
- [ ] Report shows no DTO leaks detected
- [ ] Report shows health check passed

**Then:**
- ✅ Deploy with confidence
- ✅ Document actual credentials used in QA
- ✅ Archive passing smoke report

## Next Steps

1. **Run Live QA:**
   ```bash
   npm run qa:up
   npm run qa:seed
   npm run qa:local:smoke
   ```

2. **If Live QA Passes:**
   - Update FINAL_AUDIT.md verdict to "PASSED"
   - Document which backend/seed was used
   - Archive passing smoke report
   - Begin deployment process

3. **If Live QA Fails:**
   - Check smoke report for specific failures
   - Fix frontend/backend issues
   - Re-run live QA
   - Do not proceed without passing verdict

## Security Implications

- ✅ DTO leak checks prevent accidental data exposure
- ✅ Health preflight prevents confusion with down backends
- ✅ Strict verdicts prevent false production claims
- ✅ Clear documentation reduces operational errors
- ✅ Role-specific leak checks catch backend authorization bypasses

## Summary

All QA improvements are in place. Static QA passes. Live QA is prepared and ready to validate role isolation, data leaks, and endpoint access control against a running backend. Production readiness verdict remains **BLOCKED** until live QA is executed and passes completely.
