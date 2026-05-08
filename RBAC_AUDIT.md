# RBAC Audit

Date: 2026-05-08

## Scope

Focused review of role-based access control across:
- backend authorization guards and endpoint permissions
- frontend protected routes and hidden UI actions
- payment-related endpoints
- attendance and grade modification pathways
- teacher/student privilege escalation possibilities

## Backend Authorization Model

### Global guards
- `src/app.module.ts` registers global guards:
  - `JwtAuthGuard` for JWT authentication
  - `RolesGuard` for role-based access evaluation
  - `PublicRateLimitGuard` for public auth throttling
- `RolesGuard` allows all requests if no `@Roles(...)` metadata is present.
- System-wide roles `admin`, `owner`, and `panda` are treated as full-access bypass roles.

### Role decorator
- `src/roles/roles.decorator.ts` exposes `@Roles(...roles)`.
- This decorator is applied consistently to controllers for payments, attendance, grades, homework, users, etc.

## Frontend RBAC Enforcement

### Route protection
- `src/app/router/app-router.tsx` uses `ProtectedRoute` to require authenticated app roles for `/app/*`.
- Within the app layout, `RoleGate` hides page components unless the user role is allowed by `appRoutes`.
- Route config is explicit:
  - `/app/payments` -> `['student', 'admin', 'owner', 'panda']`
  - `/app/academic` -> all app roles
  - `/app/admin-tools` -> admin-like only
- This means unauthorized route navigation is blocked at the UI layer.

### Route and backend consistency
- Frontend route gating is mostly aligned with backend role restrictions.
- There is no evidence of a frontend page exposing admin-only route components to teachers or students.
- A minor UX note: `RoleGate` returns `null` for unauthorized route access rather than redirecting, so manual URL entry by an unauthorized user may show a blank page instead of explicit denial.

## Payment Authorization

### Frontend behavior
- `src/pages/payments/payments-page.tsx` distinguishes admin-like users and students.
- `paymentsManagerRoles` are `['admin', 'owner', 'panda']`.
- Admin-like users can:
  - create payments
  - confirm payments
  - delete payments
  - filter by student and course
- Students can only view their own payment ledger via `/payments/me`.
- Action buttons for confirm/delete are only rendered for admin-like users.

### Backend enforcement
- `src/payments/payments.controller.ts` restricts:
  - `POST /payments` to admin/owner/panda
  - `GET /payments` to admin/owner/panda
  - `PATCH /payments/:id/confirm` to admin/owner/panda
  - `PATCH /payments/:id/cancel` to admin/owner/panda
  - `DELETE /payments/:id` to admin/owner/panda
- Students can only access:
  - `GET /payments/me`
  - `GET /payments/student/:studentId` if the studentId matches their own or if actor is admin-like.

### Backend access checks
- `PaymentsService.assertActorCanAccessStudent()` enforces that:
  - students can only access their own payments
  - non-system, non-student actors without branch scope are denied
  - teachers are currently not granted payment access via this path
- `createForActor`, `confirmPaymentForActor`, `cancelPaymentForActor`, and `deleteForActor` all validate student ownership.

### Conclusion
- Teachers cannot perform admin payment actions.
- Students cannot mutate payments.
- Backend permission rules align with frontend UI controls.

## Attendance Authorization

### Frontend behavior
- `src/pages/academic/academic-page.tsx` exposes attendance management controls only to roles with `capabilities.academic.manageAttendance`.
- That capability is true for teacher and admin-like roles; false for students.
- Students can only view their own attendance through `/attendance/me`.

### Backend enforcement
- `src/attendance/attendance.controller.ts` restricts:
  - `GET /attendance/me` to `Role.Student`
  - `GET /attendance/user/:userId` to student/admin/teacher/owner/panda
  - `POST /attendance` to teacher/admin/owner/panda
- Additional checks:
  - Students invoking `/attendance/user/:userId` are forbidden if `userId` is not their own.
  - `AttendanceService.assertActorCanAccessStudent()` ensures:
    - students only access their own attendance
    - teachers only access assigned students
    - system-wide roles can access all
  - `markAttendance()` also checks teacher schedule ownership before marking attendance.

### Conclusion
- Teachers can only mark attendance for their own assigned students.
- Students cannot mutate attendance.
- UI gating matches backend protection.

## Grade Authorization

### Frontend behavior
- `AcademicPage` renders grade management UI only when `capabilities.academic.manageGrades` is true.
- That capability is available to teachers and admin-like roles, not students.
- Delete buttons are shown only when `capabilities.academic.deleteGrades` is true, which is false for teachers.

### Backend enforcement
- `src/grades/grades.controller.ts` restricts:
  - `GET /grades/me` to `Role.Student`
  - `GET /grades/user/:userId` to student/admin/teacher/owner/panda
  - `POST /grades` to teacher/admin/owner/panda
  - `PATCH /grades/:id` to teacher/admin/owner/panda
  - `DELETE /grades/:id` to admin/owner/panda
- `GradesService.assertActorCanAccessStudent()` enforces:
  - students can only access their own grades
  - teachers can only access assigned students via course/group/schedule membership
  - system roles can access all
- `updateForActor()` and `removeForActor()` validate student ownership before modifying grades.

### Conclusion
- Teachers cannot escalate to delete grades.
- Students cannot mutate grades.
- Backend restrictions are stricter than frontend UI exposure.

## Homework Authorization

### Frontend behavior
- `AcademicPage` shows homework assignment UI to teachers/admin-like roles only.
- Completion action is not shown for students.
- The UI text says "Students can complete their own homework; staff views use `/attendance/user/:userId`." This is a misleading description because the page does not render a student completion action.

### Backend enforcement
- `src/homework/homework.controller.ts` restricts:
  - `GET /homework/me` to `Role.Student`
  - `GET /homework/user/:userId` to student/admin/teacher/owner/panda
  - `POST /homework` to teacher/admin/owner/panda
  - `PATCH /homework/:id/complete` to teacher/admin/owner/panda
- `HomeworkService.markCompleteForActor()` explicitly forbids students from mutating homework records.

### Conclusion
- Students cannot complete homework via the backend.
- The frontend does not render a completion button for students.
- There is a documentation/UX mismatch in the academic page description.

## Teacher and Student Privilege Escalation Review

### Teacher restrictions
- Teachers cannot access admin-only endpoints such as user administration, payment mutations, or admin tools.
- Teacher grade/attendance/homework access is limited to students connected via courses, schedules, or groups.
- Teacher `findStudentsForActor()` in `UsersService` already limits student visibility to assigned students.

### Student restrictions
- Students are limited to their own personal resources:
  - `/grades/me`
  - `/attendance/me`
  - `/homework/me`
  - `/payments/me`
- Students cannot call mutating endpoints for attendance, grades, homework, or payments.
- Student access to `/users/students` is not granted.

## Hidden UI Actions and Backend Protection

### Payments
- Confirm/delete/create buttons are hidden from students and teachers.
- Backend guards prevent those actions for non-admin roles.

### Academic workspace
- Attendance/grade/homework mutation UIs are hidden from students.
- Backend still enforces role-level and ownership-level checks if a request is crafted directly.

## Risks and Notes

- The frontend route gating and backend authorization are aligned for the areas reviewed.
- The main mismatch is a UI description in `src/pages/academic/academic-page.tsx` that suggests student homework completion, while backend rules do not allow student completion.
- `RoleGate` hides unauthorized routes but does not redirect; this is a UX concern rather than a security issue.
- No evidence was found that teachers can perform admin-only payment or user management actions.
- No evidence was found that students can mutate restricted resources in payments, attendance, grades, or homework.

## Overall Assessment

The current RBAC implementation appears secure for the audited areas. Backend endpoint protections are the authoritative barrier, and they align with frontend hidden UI actions in the payment, attendance, grade, and homework workflows.
