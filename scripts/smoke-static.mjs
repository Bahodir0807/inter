import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const checks = [];
function check(name, condition, message) {
  assert(condition, message);
  checks.push({ name, status: 'passed' });
}

const navigation = read('src/app/router/navigation.tsx');
const capabilities = read('src/shared/lib/capabilities.ts');
const dashboard = read('src/pages/dashboard/dashboard-page.tsx');
const rooms = read('src/pages/rooms/rooms-page.tsx');
const payments = read('src/pages/payments/payments-page.tsx');
const courses = read('src/pages/courses/courses-page.tsx');
const groups = read('src/pages/groups/groups-page.tsx');
const schedule = read('src/pages/schedule/schedule-page.tsx');
const academic = read('src/pages/academic/academic-page.tsx');
const http = read('src/shared/api/http.ts');
const envConfig = read('src/shared/config/env.ts');
const css = read('src/app/styles/index.css');
const i18n = read('src/shared/i18n/translations.ts');
const i18nProvider = read('src/shared/i18n/i18n.tsx');
const themeProvider = read('src/shared/theme/theme.tsx');
const languageGate = read('src/shared/i18n/language-preference.tsx');
const topbar = read('src/widgets/app-shell/topbar.tsx');
const appRouter = read('src/app/router/app-router.tsx');
const appShell = read('src/widgets/app-shell/app-shell.tsx');
const protectedRoute = read('src/features/auth/ui/protected-route.tsx');
const roleGate = read('src/features/auth/ui/role-gate.tsx');
const indexHtml = read('index.html');
const dashboardPage = read('src/pages/dashboard/dashboard-page.tsx');
const usersPage = read('src/pages/users/users-page.tsx');
const userFormModal = read('src/pages/users/user-form-modal.tsx');
const userApi = read('src/entities/user/api.ts');
const authTypes = read('src/shared/types/auth.ts');
const roomsPage = read('src/pages/rooms/rooms-page.tsx');
const paymentsPage = read('src/pages/payments/payments-page.tsx');
const schedulePage = read('src/pages/schedule/schedule-page.tsx');
const adminToolsPage = read('src/pages/admin-tools/admin-tools-page.tsx');

check('admin-like includes panda', navigation.includes("export const adminLikeRoles: Role[] = ['admin', 'owner', 'panda']"), 'adminLikeRoles must include panda');
check('payment managers include panda', navigation.includes("export const paymentsManagerRoles: Role[] = ['admin', 'owner', 'panda']"), 'paymentsManagerRoles must include panda');
check('student blocked from management routes', navigation.includes("roles: teacherWorkspaceRoles, element: <CoursesPage />") && navigation.includes("roles: teacherWorkspaceRoles, element: <GroupsPage />") && navigation.includes("roles: teacherWorkspaceRoles, element: <SchedulePage />") && navigation.includes("roles: adminLikeRoles, element: <RoomsPage />"), 'student must not have management route access');
check('student management capabilities disabled', capabilities.includes('courses: false') && capabilities.includes('groups: false') && capabilities.includes('schedule: false') && capabilities.includes('rooms: false'), 'student capabilities must block management routes');
check('admin tools capability', capabilities.includes('adminTools: true'), 'admin-like capabilities must allow admin tools');

check('dashboard guards student-only endpoints', dashboard.includes('const [homework, grades, attendance, payments] = isStudent'), 'dashboard must guard student-only endpoints by role');
check('dashboard no unconditional student-only Promise.all', !dashboard.includes('Promise.all([\n        scheduleApi.getMine(),\n        homeworkApi.getMine(),\n        gradesApi.getMine(),\n        attendanceApi.getMine()'), 'dashboard must not call student-only endpoints unconditionally');

check('rooms server pagination', rooms.includes('roomsApi.getAllPage(params)'), 'rooms must use server pagination');
check('rooms form modal', rooms.includes('RoomFormModal'), 'rooms must expose create/update modal');
check('rooms confirm modal', rooms.includes('ConfirmModal'), 'rooms delete must use confirm modal');

check('payments admin server pagination', payments.includes('paymentsApi.getAllPage(paymentParams)'), 'payments admin list must use server pagination');
check('payments student server pagination', payments.includes('paymentsApi.getMinePage(paymentParams)'), 'payments student list must use server pagination');
check('payments status filter', payments.includes("status: statusFilter === 'all' ? undefined : statusFilter"), 'payments must send status filter');

check('teacher cannot manage course UI', courses.includes('const canManage = isAdminLike'), 'course management actions must be admin-like only');
check('teacher cannot manage group UI', groups.includes('const canManage = isAdminLike'), 'group management actions must be admin-like only');
check('teacher cannot manage schedule UI', schedule.includes('const canManage = isAdminLike'), 'schedule management actions must be admin-like only');
check('teacher groups use server scope', groups.includes("groupsApi.getAll(isTeacher && sessionUser ? { teacherId: sessionUser.id } : undefined)"), 'teacher groups view must request teacher-scoped data');
check('teacher courses use server scope', courses.includes("coursesApi.getAll(isTeacher && sessionUser ? { teacherId: sessionUser.id } : undefined)"), 'teacher courses view must request teacher-scoped data');
check('teacher cannot delete grades in UI', academic.includes('capabilities.academic.deleteGrades'), 'grade delete action must have a separate admin-like capability');
check('staff academic scope starts empty', academic.includes("const [selectedUserId, setSelectedUserId] = useState('')"), 'staff academic queries must wait for explicit student selection');
check('student homework completion hidden', academic.includes("item.completed || user?.role === 'student'"), 'student homework mutation action must be hidden');
check('teacher avoids user schedule lookup', academic.includes('canLookupUserSchedule ? scheduleApi.getByUser(effectiveUserId) : scheduleApi.getMine()') && academic.includes("enabled: !!effectiveUserId && (canLookupUserSchedule || user?.role === 'teacher')"), 'teacher academic view must use /schedule/me instead of /schedule/user/:id');
check('teacher notifications disabled', capabilities.includes('sendNotifications: false'), 'teacher notification mutation capability must be disabled');

check('http preserves envelope meta', http.includes('response.apiMeta = unwrapped.meta'), 'http client must preserve envelope meta');
check('http reads backend error message', http.includes('body?.error?.message'), 'http client must read backend error.message');
check('http reads backend validation details', http.includes('body?.error?.details'), 'http client must read backend validation details');
check('http avoids custom request-id header for production CORS compatibility', !http.includes("config.headers['X-Request-Id']") && !http.includes("'X-Request-Id': createRequestId()"), 'frontend must not send X-Request-Id unless production CORS allows it');
check('api url uses VITE_API_BASE_URL', envConfig.includes('import.meta.env.VITE_API_BASE_URL'), 'frontend must read VITE_API_BASE_URL');
check('api url uses configured backend domain', envConfig.includes("const defaultApiUrl = 'https://ibrat-backend-hi7w.onrender.com'"), 'frontend API fallback must use the Render backend domain');
check('favicon is declared', indexHtml.includes('rel="icon"') && indexHtml.includes('/favicon.svg'), 'index.html must declare favicon');

check('theme tokens use requested light background', css.includes('--color-bg: #F4F7FB'), 'light theme must define requested background token');
check('theme tokens use requested dark background', css.includes("--color-bg: #0B1220"), 'dark theme must define requested background token');
check('theme uses data-theme dark selector', css.includes(":root[data-theme='dark']"), 'dark theme must apply globally through data-theme');
check('app shell owns viewport scroll', css.includes('.app-shell {\n  display: flex;\n  width: 100%;\n  height: 100dvh;') && css.includes('.app-shell__content') && css.includes('overflow-y: auto') && css.includes('body {\n  min-width: 320px;\n  overflow: hidden;'), 'authenticated app shell must keep sidebar/topbar stable and scroll only the content area');
check('light theme sidebar is theme aware', css.includes(":root:not([data-theme='dark']) .app-sidebar {\n  color: #0F172A;") && css.includes("background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.94));"), 'light theme sidebar must use light workspace styling instead of dark navy styling');
check('theme persists to localStorage', themeProvider.includes("window.localStorage.setItem(themeStorageKey, theme)"), 'theme selection must persist');
check('default theme is light', themeProvider.includes("return stored === 'dark' ? 'dark' : 'light'"), 'default theme must be light');

check('i18n has ru translations', i18n.includes('ru: {') && i18n.includes("'language.title': 'Выберите язык интерфейса'"), 'ru translations must exist');
check('i18n has uz translations', i18n.includes('uz: {') && i18n.includes("'language.title': 'Interfeys tilini tanlang'"), 'uz translations must exist');
check('i18n has en translations', i18n.includes('en: {') && i18n.includes("'language.title': 'Choose interface language'"), 'en translations must exist');
check('i18n fallback is ru', i18n.includes("export const fallbackLanguage: Language = 'ru'"), 'fallback language must be ru');
check('language persists to localStorage', i18nProvider.includes('window.localStorage.setItem(languageStorageKey, nextLanguage)'), 'language selection must persist');
check('first-entry language selector exists', languageGate.includes('hasStoredLanguage') && languageGate.includes('languageOptions.map') && i18n.includes('Русский') && i18n.includes('O‘zbekcha') && i18n.includes('English'), 'first-entry language selector must show all three language choices');
check('topbar language switcher exists', topbar.includes('setLanguage') && topbar.includes('languageOptions.map'), 'topbar must include language switcher');
check('topbar theme switcher exists', topbar.includes('setTheme') && topbar.includes('theme.dark'), 'topbar must include theme switcher');
check('payment status labels translated', i18n.includes('paymentStatus.pending') && i18n.includes('paymentStatus.confirmed') && i18n.includes('paymentStatus.cancelled'), 'payment status display labels must be translated');
check('role labels translated', i18n.includes('roles.owner') && i18n.includes('roles.teacher') && i18n.includes('roles.student') && i18n.includes('roles.panda'), 'role display labels must be translated');

check('app shell is nested route layout', appRouter.includes('path="/app" element={<AppShell />}') && appShell.includes('<Outlet />'), 'AppShell must be a persistent nested route layout that renders Outlet');
check('app shell does not own nested Routes', !appShell.includes('<Routes') && !appRouter.includes('function AppLayout()'), 'AppShell must not recreate page Routes internally');
check('authenticated app routes are protected before shell', appRouter.includes('<Route element={<ProtectedRoute roles={[\'student\', \'teacher\', \'admin\', \'owner\', \'panda\']} />}>') && appRouter.indexOf('<Route element={<ProtectedRoute') < appRouter.indexOf('path="/app" element={<AppShell />}'), 'ProtectedRoute must wrap authenticated AppShell routes');
check('app route permissions still use RoleGate', appRouter.includes('<RoleGate roles={route.roles}>') && roleGate.includes('!roles.includes(user.role)') && protectedRoute.includes('return <Outlet />'), 'RoleGate and ProtectedRoute must preserve role access through nested outlets');
check('sidebar and topbar mounted once in shell', (appShell.match(/<Sidebar/g) ?? []).length === 1 && (appShell.match(/<Topbar/g) ?? []).length === 1 && appShell.indexOf('<Sidebar') < appShell.indexOf('<Outlet />'), 'Sidebar and Topbar must be mounted once outside route content');

const persistedStudentUserFields = [
  'email',
  'phoneNumber',
  'telegramId',
  'studentYear',
  'paymentMethod',
  'contactOwner',
  'contactOwnerFullName',
  'contactOwnerRelation',
];

for (const field of persistedStudentUserFields) {
  check(
    `user form schema includes ${field}`,
    userFormModal.includes(`${field}:`),
    `User form schema/defaults/reset must include ${field}`,
  );
  check(
    `AppUser includes ${field}`,
    authTypes.includes(`${field}?:`),
    `AppUser must include ${field} so GET /users and GET /users/students responses hydrate edit forms`,
  );
  check(
    `UserFormValues includes ${field}`,
    userApi.includes(`${field}?:`),
    `UserFormValues must include ${field} so POST /users and PATCH /users/:id can send it`,
  );
}

check('user create posts normalized payload', userApi.includes("http.post<AppUser>('/users', normalizeUserPayload(payload))"), 'usersApi.create must POST the normalized user payload');
check('user update patches normalized payload', userApi.includes('http.patch<AppUser>(`/users/${id}`, normalizeUserPayload(payload, { clearEmptyOptionals: true }))'), 'usersApi.update must PATCH /users/:id with the normalized user payload');
check('user update does not use PUT', !userApi.includes('http.put<AppUser>(`/users/${id}`'), 'usersApi.update must not use PUT /users/:id');
check('student profile fields scoped to students', usersPage.includes('omitStudentProfileForNonStudent') && usersPage.includes('studentProfileFields'), 'student-only profile fields must be omitted when saving non-student users');
check('normalizer clears empty optional fields on edit', userApi.includes('clearEmptyOptionals') && userApi.includes('normalized[key] = null'), 'empty optional user fields must be clearable during edits');

const forbiddenRussianEnglishLabels = [
  'Users',
  'Courses',
  'Groups',
  'Schedule',
  'Payments',
  'Profile',
  'Admin',
  'Today',
  'Overview',
  'Search',
  'All roles',
  'Name A-Z',
  'Actions',
  'View',
  'Edit',
  'Delete',
  'User directory',
  'Roles, status, and contact details',
  'Telegram not linked',
  'No contact details yet',
  'All accounts',
  'All records',
  'Current role',
];

const ruBlock = i18n.slice(i18n.indexOf('  ru: {'), i18n.indexOf('  uz: {'));
for (const label of forbiddenRussianEnglishLabels) {
  check(
    `ru visible label translated: ${label}`,
    !ruBlock.includes(`: '${label}'`) && !ruBlock.includes(`: "${label}"`),
    `Russian translations must not expose English label "${label}"`,
  );
}

const visibleUiSources = [
  dashboardPage,
  usersPage,
  roomsPage,
  paymentsPage,
  schedulePage,
  adminToolsPage,
  topbar,
].join('\n');

const rawVisibleEnglishLabels = [
  '"Users"',
  '"Courses"',
  '"Groups"',
  '"Schedule"',
  '"Payments"',
  '"Profile"',
  '"Admin"',
  '"Today"',
  '"Overview"',
  '"Search"',
  '"All roles"',
  '"Name A-Z"',
  '"Actions"',
  '"View"',
  '"Edit"',
  '"Delete"',
  '"User directory"',
  '"Roles, status, and contact details"',
  '"Telegram not linked"',
  '"No contact details yet"',
  '"All accounts"',
  '"All records"',
  '"Current role"',
  "'Users'",
  "'Courses'",
  "'Groups'",
  "'Schedule'",
  "'Payments'",
  "'Profile'",
  "'Admin'",
  "'Today'",
  "'Overview'",
  "'Search'",
  "'All roles'",
  "'Name A-Z'",
  "'Actions'",
  "'View'",
  "'Edit'",
  "'Delete'",
  "'User directory'",
  "'Roles, status, and contact details'",
  "'Telegram not linked'",
  "'No contact details yet'",
  "'All accounts'",
  "'All records'",
  "'Current role'",
];

for (const literal of rawVisibleEnglishLabels) {
  check(
    `no raw visible English label ${literal}`,
    !visibleUiSources.includes(literal),
    `Use translation helpers instead of raw visible label ${literal}`,
  );
}

mkdirSync(new URL('../reports', import.meta.url), { recursive: true });
const report = {
  type: 'static-smoke',
  status: 'passed',
  timestamp: new Date().toISOString(),
  checks,
};
writeFileSync(new URL('../reports/smoke-static.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
  new URL('../reports/smoke-static.md', import.meta.url),
  `# Static Smoke Report\n\nStatus: passed\n\nGenerated: ${report.timestamp}\n\n${checks.map(item => `- ${item.status}: ${item.name}`).join('\n')}\n`,
);
console.log('static smoke: route roles, endpoint guards, pagination, and error envelope OK');
