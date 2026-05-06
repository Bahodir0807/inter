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
const http = read('src/shared/api/http.ts');

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

check('http preserves envelope meta', http.includes('response.apiMeta = unwrapped.meta'), 'http client must preserve envelope meta');
check('http reads backend error message', http.includes('body?.error?.message'), 'http client must read backend error.message');
check('http reads backend validation details', http.includes('body?.error?.details'), 'http client must read backend validation details');

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
