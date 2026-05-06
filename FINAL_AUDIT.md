# FINAL AUDIT

Date: 2026-05-06

Scope:
- Frontend: `D:\MyProjects\frontе`
- Backend: `D:\MyProjects\ibrat-backend`
- Backend framework: NestJS REST API with JWT, role guards, response envelope, and paginated list responses.

## Production Polish Summary

Implemented:
- Backend response envelope support: `{ success, data, meta }`.
- Backend error response support: `{ success:false, error:{ code, message, details }, meta }`.
- Pagination metadata support through `meta.pagination`.
- Route-level lazy loading for heavy pages.
- React Query defaults tuned for CRM usage: 60s stale time, 10m cache GC, no mutation retries.
- Search debounce hook and URL state hook.
- URL persistence for server-driven `rooms` and `payments` filters/search/pagination.
- Role route map aligned with backend access rules for `admin`, `owner`, `panda`, `teacher`, and `student`.
- Student-only dashboard calls disabled for teacher/admin/panda.
- Destructive actions use confirm dialogs.
- Mutating actions use toast errors/success and disabled loading states where forms/modals are present.
- Static smoke checks for role route wiring, student-only endpoint guards, rooms/payments server pagination, and backend envelope handling.
- Live smoke harness for role endpoint walkthrough and optional mutating CRUD checks.
- QA environment structure: isolated MongoDB database, backend/frontend Dockerfiles, `docker-compose.qa.yml`, QA env templates, one-command seed, and smoke report output.
- Runtime observability: frontend error boundary, global React Query error capture hooks, Sentry integration points, `X-Request-Id` propagation, backend `/version`, and frontend environment/version badge.

Known remaining consistency work:
- Older pages `users`, `courses`, `groups`, and `schedule` still use a mix of client-side table filtering/pagination and backend list endpoints. API clients support server-side query params, but those pages need a deeper table refactor to fully move state to backend pagination.
- `Admin tools` and `Academic` are production-connected but intentionally compact. They expose backend actions, but can be split into richer sub-pages later.

## Role Walkthrough

QA status:
- Static role/route smoke: passed.
- Frontend production build: passed.
- Backend build after seed change: passed.
- Read-only live smoke against `https://b.sultonoway.uz`: blocked at login because default seed credentials are not valid on the live backend.
- Mutating live smoke was not run against production because it creates/updates/deletes test data and requires explicit approval.

Prepared QA credentials:

The backend seed script now prepares these usernames when run:

| Role | Username env | Default username | Password env |
|---|---|---|---|
| Owner | `SEED_OWNER_USERNAME` | `owner` | `SEED_DEFAULT_PASSWORD` |
| Admin | `SEED_ADMIN_USERNAME` | `branch_admin` | `SEED_DEFAULT_PASSWORD` |
| Panda | `SEED_PANDA_USERNAME` | `panda` | `SEED_DEFAULT_PASSWORD` |
| Teacher | `SEED_TEACHER_USERNAME` | `teacher` | `SEED_DEFAULT_PASSWORD` |
| Student | `SEED_STUDENT_USERNAME` | `student` | `SEED_DEFAULT_PASSWORD` |

Default seed password is `ChangeMe123!` unless overridden by `SEED_DEFAULT_PASSWORD`.

Production safety:
- `scripts/seed.ts` now refuses to run with `NODE_ENV=production` unless `SEED_ALLOW_PRODUCTION=true`.
- This prevents accidental writes to the production MongoDB configured in backend `.env`.

Live smoke commands:

```bash
npm run smoke:static
npm run smoke:live
SMOKE_MUTATE=true npm run smoke:live
```

Use `SMOKE_*` env vars to override usernames/passwords for real QA accounts.

### Admin / Owner / Panda

Accessible pages:
- Dashboard
- Users
- Courses
- Groups
- Schedule
- Rooms
- Payments
- Academic
- Admin tools
- Profile

Important endpoint behavior:
- Uses full list endpoints for operational resources.
- Uses admin-only users, payments, roles, statistics, phone-request endpoints.
- Does not call student-only `/attendance/me`, `/grades/me`, or `/homework/me` from dashboard.
- Academic user views use `/attendance/user/:userId`, `/grades/user/:userId`, `/homework/user/:userId`, `/schedule/user/:id`.

Permission-sensitive UI:
- Delete buttons are shown only where backend allows delete.
- Rooms management is shown for admin/owner/panda only.
- Payment create/confirm/delete is shown for admin/owner/panda only.
- Role/statistics/phone-request tools are admin-like only.

### Teacher

Accessible pages:
- Dashboard
- Users
- Courses
- Groups
- Schedule
- Rooms
- Academic
- Profile

Important endpoint behavior:
- Users page uses `/users/students`, not `/users`.
- Dashboard uses `/schedule/me` only for teacher workspace data.
- Dashboard does not call `/attendance/me`, `/grades/me`, `/homework/me`.
- Academic page can manage attendance, grades, homework, and notifications through teacher-allowed endpoints.

Permission-sensitive UI:
- No payments page.
- No admin tools page.
- No user create/delete/role/status management.
- No room CRUD.
- No destructive group/course/schedule deletes unless backend allows the role.

### Student

Accessible pages:
- Dashboard
- Courses
- Groups
- Schedule
- Rooms
- Payments
- Academic
- Profile

Important endpoint behavior:
- Dashboard uses `/schedule/me`, `/homework/me`, `/grades/me`, `/attendance/me`, `/payments/me`.
- Groups and rooms are read-only.
- Academic page uses student-owned `me` endpoints.
- Student can complete homework through `/homework/:id/complete`.

Permission-sensitive UI:
- No users page.
- No create/edit/delete buttons for groups, rooms, courses, schedule, payments.
- No admin tools.
- No staff-only academic create actions.

## Backend Endpoint Coverage

### Public / Health

| Endpoint | Frontend usage | Notes |
|---|---|---|
| `GET /` | Not used in CRM UI | Service root/health-style endpoint, not product UI. |
| `GET /ping` | Not used in CRM UI | Operational health endpoint. |
| `GET /health` | Not used in CRM UI | Deployment/monitoring endpoint. |
| `GET /health/live` | Not used in CRM UI | Deployment/monitoring endpoint. |
| `GET /health/ready` | Not used in CRM UI | Deployment/monitoring endpoint. |
| `GET /version` | Used operationally | Public runtime metadata endpoint for deploy/build checks. |

### Auth

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `POST /auth/login` | Used | Login form |
| `POST /auth/register` | API client mapped | No public registration screen yet; product flow is staff-created users. |
| `POST /auth/refresh` | API client mapped | Store currently persists access token; refresh flow can be wired when backend token rotation policy is finalized. |
| `POST /auth/logout` | API client mapped | Current logout is local-token clear; backend logout requires refresh token. |
| `POST /auth/change-password` | Used | Profile |
| `GET /auth/me` | Used | Session bootstrap |
| `POST /auth/me` | API client mapped | Compatibility endpoint; `GET /auth/me` is primary frontend path. |

### Users

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `GET /users/me` | Used | Profile |
| `PATCH /users/me/profile` | Used | Profile edit modal |
| `GET /users` | Used | Users, Dashboard, support lists |
| `GET /users/search` | API client mapped | Dedicated one-key lookup UI not yet separate; table search uses list/search params. |
| `GET /users/students` | Used | Users for teacher, payment/course/group/schedule support lists, Academic |
| `GET /users/:id` | API client mapped | Detail modal currently uses loaded row; direct refetch-by-id can be added for deep-link detail views. |
| `POST /users` | Used | Users create modal |
| `PUT /users/:id` | Used | Users edit modal |
| `PATCH /users/:id/role` | Used | Users edit modal |
| `PATCH /users/:id/status` | API client mapped | Status action UI should be added as a separate admin control. |
| `DELETE /users/:id` | Used | Users delete confirm |

### Courses

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `GET /courses` | Used | Courses, Dashboard, support lists |
| `GET /courses/:id` | API client mapped | Row detail is currently inline; deep-link detail UI can use this. |
| `POST /courses` | Used | Courses create modal |
| `PATCH /courses/:id` | Used | Courses edit modal |
| `DELETE /courses/:id` | Used | Courses delete confirm for admin-like roles |
| `PATCH /courses/:id/add-students` | API client mapped | Current edit sends `students` via course update; separate quick-add UX is a product improvement. |

### Groups

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `GET /groups` | Used | Groups, Dashboard, Schedule support |
| `GET /groups/:id` | API client mapped | Row detail is currently inline; deep-link detail UI can use this. |
| `POST /groups` | Used | Groups create modal |
| `PATCH /groups/:id` | Used | Groups edit modal |
| `DELETE /groups/:id` | Used | Groups delete confirm for admin-like roles |

### Schedule

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `GET /schedule` | Used | Schedule full view, Dashboard admin-like |
| `GET /schedule/me` | Used | Student/teacher dashboard and schedule |
| `GET /schedule/user/:id` | Used | Academic user schedule lookup |
| `GET /schedule/:id` | API client mapped | Row detail is inline; direct detail route not yet added. |
| `POST /schedule` | Used | Schedule create modal |
| `PUT /schedule/:id` | Used | Schedule edit modal |
| `DELETE /schedule/:id` | Used | Schedule delete confirm for admin-like roles |

### Rooms

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `GET /rooms` | Used with server pagination/search/filter/sort | Rooms, Dashboard, Schedule support |
| `GET /rooms/:id` | API client mapped | Row detail currently inline; getById available for detail route. |
| `POST /rooms` | Used | Rooms create modal |
| `PATCH /rooms/:id` | Used | Rooms edit modal |
| `DELETE /rooms/:id` | Used | Rooms delete confirm |

### Payments

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `GET /payments` | Used with server pagination/search/filter/sort | Payments admin-like |
| `GET /payments/me` | Used with server pagination/search/filter/sort | Payments student |
| `GET /payments/student/:studentId` | API client mapped | Useful for future student detail drawer. |
| `POST /payments` | Used | Payments create modal |
| `PATCH /payments/:id/confirm` | Used | Payments confirm action |
| `PATCH /payments/:id/cancel` | API client mapped | UI currently lacks cancel action; add if product wants cancellation workflow. |
| `DELETE /payments/:id` | Used | Payments delete confirm |

### Attendance

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `GET /attendance/me` | Used only for student | Dashboard, Academic |
| `GET /attendance/user/:userId` | Used for staff | Academic |
| `POST /attendance` | Used | Academic mark attendance |

### Grades

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `GET /grades/me` | Used only for student | Dashboard, Academic |
| `GET /grades/user/:userId` | Used for staff | Academic |
| `POST /grades` | Used | Academic add grade |
| `PATCH /grades/:id` | Used | Academic grade update action |
| `DELETE /grades/:id` | Used | Academic delete confirm |

### Homework

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `GET /homework/me` | Used only for student | Dashboard, Academic |
| `GET /homework/user/:userId` | Used for staff | Academic |
| `POST /homework` | Used | Academic assign homework |
| `PATCH /homework/:id/complete` | Used | Academic/homework completion |

### Notifications

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `POST /notifications` | Used | Academic manual notification panel |

### Roles

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `GET /roles` | Used | Admin tools |
| `GET /roles/:name` | Used as lookup action | Admin tools |
| `POST /roles` | Used | Admin tools |
| `PATCH /roles/:name` | API client mapped | Full edit form not yet expanded; create/delete/lookup are visible. |
| `DELETE /roles/:name` | Used | Admin tools |

### Statistics

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `GET /statistics` | Used | Admin tools |
| `GET /statistics/:type` | API client mapped | Current list filters by type through query; direct route method available. |
| `POST /statistics` | Used | Admin tools |
| `PATCH /statistics/:id` | Used | Admin tools patch action |
| `DELETE /statistics/:id` | Used | Admin tools |

### Phone Request

| Endpoint | Frontend usage | Screen / module |
|---|---|---|
| `POST /phone-request` | API client mapped | Public flow, not internal CRM nav. |
| `GET /phone-request` | API client mapped | Public status check, not internal CRM nav. |
| `GET /phone-request/pending` | Used | Admin tools |
| `PATCH /phone-request` | Used | Admin tools approve/reject |
| `POST /phone-request/tg-request` | API client mapped | Telegram/public flow. |
| `GET /phone-request/tg-check` | API client mapped | Telegram/public flow. |

## Query Params / Filters / Pagination

Backend list base:
- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Frontend support:
- API clients expose these params for all paginated backend list modules.
- `Rooms` and `Payments` use server-side pagination/search/filter/sort in UI with URL persistence.
- `Users`, `Courses`, `Groups`, and `Schedule` still need migration from client-side table filtering to backend-driven table state for perfect consistency at large data volume.
- `Admin tools` uses server list params for roles/statistics/phone requests.

## Error Handling

Frontend handles:
- Legacy top-level `message`.
- Backend envelope errors: `error.message`.
- Validation details: `error.details`.
- `401`, `403`, `429` friendly fallbacks.

Remaining improvement:
- Display backend `requestId` in error blocks for support/debugging.

## QA Environment

Added:
- `docker-compose.qa.yml`
- Frontend `Dockerfile`
- Backend `Dockerfile`
- Frontend `.env.example`
- Frontend `.env.qa.example`
- Backend `.env.example`
- Backend `.env.qa.example`
- Backend `.env.staging.local.example`
- `QA_README.md`
- non-Docker QA PowerShell scripts

QA stack:
- MongoDB container on host port `27018`.
- Backend on `http://localhost:3000`.
- Frontend preview on `http://localhost:4173`.
- Isolated Mongo database: `ibrat_qa`.

Commands:

```bash
npm run qa:up
npm run qa:seed
npm run smoke:static
$env:SMOKE_API_URL="http://localhost:3000"; npm run smoke:live
$env:SMOKE_API_URL="http://localhost:3000"; $env:SMOKE_MUTATE="true"; npm run smoke:live
```

Seed data:
- owner/admin/panda/teacher/student users.
- sample course.
- sample group.
- QA room.
- schedule entry.
- pending test payment.
- attendance record.
- grade record.
- homework record.

## Observability

Backend:
- Structured request logging exists through `LoggingInterceptor`.
- `X-Request-Id` is accepted from clients, sanitized, logged, and returned on responses.
- CORS now allows `X-Request-Id`.
- `/health`, `/health/live`, `/health/ready`, and `/version` are public operational endpoints.

Frontend:
- Every API request sends `X-Request-Id`.
- Error boundary catches render crashes.
- React Query global query/mutation error hooks dispatch observability events.
- Sentry integration point is prepared through `VITE_SENTRY_DSN`.
- Environment badge shows `DEV / QA / PROD`, app version, and build hash tooltip.

## Security / Production Pass

Checked:
- Backend refresh-token rotation exists and stores hashed refresh sessions.
- Backend logout revokes the refresh session.
- Frontend logout now calls backend logout when a refresh token exists, then clears local session.
- Frontend refreshes access token once on `401` when a refresh token exists.
- Backend change-password revokes all user sessions.
- Production/staging config validation rejects short JWT secrets and wildcard CORS.
- Public auth/phone endpoints are rate-limited by `PublicRateLimitGuard`.
- Hidden routes/direct URL access are protected by `ProtectedRoute` and `RoleGate`; backend remains source of truth with JWT + roles guards.

Risks to keep monitoring:
- In-memory public rate limit is per Node process; use Redis or gateway-level rate limiting for multi-instance production.
- Public phone-request endpoints remain intentionally public; monitor abuse and consider CAPTCHA/Telegram-only verification if spam appears.
- Frontend route hiding is UX only; backend guards remain required for all permission enforcement.

## Product Improvements

Recommended next:
- Add direct detail routes/drawers for `getById` endpoints: users, courses, groups, schedule, rooms.
- Add a dedicated user status control for `PATCH /users/:id/status`.
- Add payment cancel workflow for `PATCH /payments/:id/cancel`.
- Split `Academic` into Attendance, Grades, Homework, Notifications sub-routes once usage grows.
- Split `Admin tools` into Roles, Statistics, Phone Requests sub-routes.
- Add route-level optimistic updates for small actions like homework complete and phone request approve/reject.
- Add Playwright role smoke tests for admin, teacher, and student.
- Add table abstraction for URL-backed server pagination across every list page.
- Add refresh-token backed logout/session renewal once product token policy is finalized.

## Known Limitations

- Automated browser role walkthrough was not added because the frontend project currently has no browser test runner dependency. The new live smoke harness verifies API permissions and endpoint behavior; Playwright should be added for true UI clicks.
- Live role walkthrough against production could not proceed because default seed credentials returned `401 Invalid credentials`.
- Live CRUD verification against production was intentionally not run without explicit approval because it mutates rooms and other records.
- Public Telegram phone-request endpoints are mapped, but no internal CRM screen should normally submit those flows.
- The frontend exposes all backend capabilities, but some are compact admin panels rather than fully specialized product workflows.

## Final QA Results

### Smoke Tests Added

| Test | Command | Result |
|---|---|---|
| Static frontend role/API smoke | `npm run smoke:static` | Passed |
| Frontend production build | `npm.cmd run build` | Passed |
| Backend build | `npm.cmd run build` in backend | Passed |
| Read-only live smoke | `npm run smoke:live` | Failed at login: default seed admin credentials are not valid on live backend |
| Mutating live smoke | `SMOKE_MUTATE=true npm run smoke:live` | Not run without explicit production mutation approval |
| QA compose live smoke | `SMOKE_API_URL=http://localhost:3000 npm run smoke:live` | Prepared; not run because QA stack was not started in this session |

### Isolated QA Validation Attempt

Requested QA command order was attempted against local QA only:

| Step | Command | Result |
|---|---|---|
| Docker stack | `npm run qa:up` | Failed: `docker` command is not available in this environment/PATH |
| Seed | `npm run qa:seed` | Failed: `docker` command is not available in this environment/PATH |
| Read-only smoke | `SMOKE_API_URL=http://localhost:3000 npm run smoke:live` | Failed: `fetch failed`, no local backend was running |
| Mutating smoke | `SMOKE_API_URL=http://localhost:3000 SMOKE_MUTATE=true npm run smoke:live` | Failed before mutation: `fetch failed`, no local backend was running |

Reports generated:

- `reports/smoke-static.json`
- `reports/smoke-static.md`
- `reports/smoke-live-readonly.json`
- `reports/smoke-live-readonly.md`
- `reports/smoke-live-mutating.json`
- `reports/smoke-live-mutating.md`

No production endpoints were used for this QA validation attempt.

### Non-Docker Local QA

Added as an alternative when Docker is unavailable:

| Script | Purpose |
|---|---|
| `npm run qa:local:backend` | Starts backend via `npm run start:dev` with `NODE_ENV=staging` |
| `npm run qa:local:seed` | Seeds isolated QA users/data using backend `.env.staging.local` |
| `npm run qa:local:smoke` | Runs read-only smoke against `http://localhost:3000` |
| `npm run qa:local:smoke:mutate` | Runs mutating smoke against `http://localhost:3000` |

Database options:
- local MongoDB: `mongodb://localhost:27017`, database `ibrat_qa`
- MongoDB Atlas QA database: set `MONGO_URI` and `MONGO_DB_NAME=ibrat_qa` in `..\ibrat-backend\.env.staging.local`

Backend seed now loads env files in the same order as the Nest runtime path for QA scripts:
- `.env.<NODE_ENV>.local`
- `.env.<NODE_ENV>`
- `.env.local`
- `.env`

### Found Bugs / Risks

| Finding | Status |
|---|---|
| Seed did not create `panda` test user | Fixed in backend `scripts/seed.ts` |
| Seed could write to production accidentally | Fixed with `SEED_ALLOW_PRODUCTION=true` guard |
| No smoke scripts in frontend | Fixed with `smoke:static` and `smoke:live` scripts |
| Production QA credentials unavailable/invalid | Still open; needs seed run or real QA credentials |
| Full UI browser walkthrough absent | Still open; needs Playwright or equivalent browser test dependency |
| No isolated QA environment | Fixed with Dockerfiles, compose, env examples, seed profile, and QA README |
| No build/version display | Fixed with `/version` and frontend environment badge |
| No frontend error boundary/global query error hooks | Fixed with error boundary and observability event hooks |

### Edge Case Coverage

Covered in code/static smoke:
- Expired token path in live smoke harness.
- `403/401` forbidden endpoint expectations by role in live smoke harness.
- Backend validation error shape in HTTP client.
- Delete confirmation patterns for destructive frontend actions.
- Server pagination meta preservation.
- Student-only endpoint guard in dashboard.

Needs live/browser verification:
- Slow network skeleton behavior.
- Delete cancel/confirm through actual UI clicks.
- Pagination after deleting the last record on a page.
- Profile edit/change password with real QA credentials.
- Route guard redirects through actual browser navigation.

## Pre-Production Role Visibility Pass - 2026-05-06

### Role Visibility Matrix

| Area | panda / owner / admin | teacher | student |
|---|---|---|---|
| Users | full list/search/detail/create/update/status/role/delete | own profile + own students via `/users/students` | own profile only |
| Courses | full read/create/update/delete/enrollment | own assigned courses read-only | enrolled courses read-only |
| Groups | full read/create/update/delete | own groups read-only | own groups read-only |
| Schedule | full read/create/update/delete/user lookup | own schedule read-only | own schedule read-only |
| Rooms | full read/create/update/delete | read only through own schedule scope | read only through own schedule scope |
| Payments | full ledger + lifecycle actions | no UI / no endpoints | own payment history/status |
| Attendance | full read + mark | own students/groups read + mark | own read-only |
| Homework | full read + assign/complete | own students/groups read + assign/complete | own read-only |
| Grades | full read/create/update/delete | own students/groups read/create/update, no delete | own read-only |
| Statistics | admin tools only | hidden/forbidden | hidden/forbidden |
| Notifications | send allowed | hidden/forbidden | hidden/forbidden |

### Fixes Applied

Backend:
- Removed teacher role access from course/group/schedule structural mutation endpoints.
- Added service-level mutation guards for courses, groups, and schedule.
- Removed student access from homework completion mutation.
- Restricted notifications to admin-like roles at controller and service level.
- Added `src/pre-production-role-access.spec.ts` with teacher/student negative mutation checks.

Frontend:
- Course/group/schedule create/edit/delete UI is now admin-like only.
- Teacher keeps read-only teaching workspace for courses/groups/schedule.
- Grade delete action now uses separate admin-like `deleteGrades` capability.
- Teacher notification UI is disabled.
- Student homework completion action is hidden.
- Teacher academic workspace no longer calls `/schedule/user/:id`; that lookup is admin-like only.
- Staff academic scope now starts empty, so attendance/homework/grade queries wait for an explicit student selection.
- Added frontend `test`, `lint`, and `typecheck` scripts. `test` runs static smoke; `lint` currently aliases typecheck until ESLint is added.
- Static smoke now verifies role-gated structural mutations and student homework mutation visibility.

### Validation Results

| Check | Result |
|---|---|
| Backend `npm run build` | Passed |
| Backend `npm test` | Passed, 12 suites / 55 tests |
| Backend `npm run test:e2e` | Passed, 1 suite / 5 tests |
| Backend `npm test -- --runInBand --detectOpenHandles` | Passed, no open handles reported |
| Frontend `npm run build` | Passed |
| Frontend `npm test` | Passed via static smoke |
| Frontend `npm run lint` | Passed via typecheck alias |
| Frontend `npm run typecheck` | Passed |
| Frontend `npm run smoke:static` | Passed |

### Remaining Production Risks

- No browser-level role walkthrough was run in this pass because local QA backend/Mongo was not started.
- Frontend lint is a typecheck alias until ESLint is configured.
- Live mutating smoke remains blocked without explicit QA/local DB confirmation.
