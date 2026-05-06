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
const css = read('src/app/styles/index.css');
const i18n = read('src/shared/i18n/translations.ts');
const i18nProvider = read('src/shared/i18n/i18n.tsx');
const themeProvider = read('src/shared/theme/theme.tsx');
const languageGate = read('src/shared/i18n/language-preference.tsx');
const topbar = read('src/widgets/app-shell/topbar.tsx');

check('admin-like includes panda', navigation.includes("export const adminLikeRoles: Role[] = ['admin', 'owner', 'panda']"), 'adminLikeRoles must include panda');
check('payment managers include panda', navigation.includes("export const paymentsManagerRoles: Role[] = ['admin', 'owner', 'panda']"), 'paymentsManagerRoles must include panda');
check('rooms route for all app roles', navigation.includes("roles: allAppRoles, element: <RoomsPage />"), 'rooms route must be available to all app roles');
check('groups route for all app roles', navigation.includes("roles: allAppRoles, element: <GroupsPage />"), 'groups route must be available to all app roles');
check('student rooms capability', capabilities.includes('rooms: true'), 'student capabilities must allow rooms route');
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
check('teacher cannot delete grades in UI', academic.includes('capabilities.academic.deleteGrades'), 'grade delete action must have a separate admin-like capability');
check('staff academic scope starts empty', academic.includes("const [selectedUserId, setSelectedUserId] = useState('')"), 'staff academic queries must wait for explicit student selection');
check('student homework completion hidden', academic.includes("item.completed || user?.role === 'student'"), 'student homework mutation action must be hidden');
check('teacher avoids user schedule lookup', academic.includes('canLookupUserSchedule') && academic.includes('enabled: !!effectiveUserId && canLookupUserSchedule'), 'teacher academic view must not call /schedule/user/:id');
check('teacher notifications disabled', capabilities.includes('sendNotifications: false'), 'teacher notification mutation capability must be disabled');

check('http preserves envelope meta', http.includes('response.apiMeta = unwrapped.meta'), 'http client must preserve envelope meta');
check('http reads backend error message', http.includes('body?.error?.message'), 'http client must read backend error.message');
check('http reads backend validation details', http.includes('body?.error?.details'), 'http client must read backend validation details');

check('theme tokens use requested light background', css.includes('--color-bg: #f8fafc'), 'light theme must define requested background token');
check('theme tokens use requested dark background', css.includes("--color-bg: #020617"), 'dark theme must define requested background token');
check('theme uses data-theme dark selector', css.includes(":root[data-theme='dark']"), 'dark theme must apply globally through data-theme');
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
