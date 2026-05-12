import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const widths = [360, 390, 430, 600, 768, 900, 1024, 1280, 1440];
const appBaseUrl = process.env.QA_BASE_URL ?? 'http://127.0.0.1:5173';
const cdpBaseUrl = process.env.QA_CDP_URL ?? 'http://127.0.0.1:9222';
const appOrigin = new URL(appBaseUrl).origin;
const backendOrigins = new Set([
  'https://ibrat-backend-hi7w.onrender.com',
  'http://127.0.0.1:3000',
]);
const frontendModulePattern = /(?:^\/(?:src|@vite|node_modules)\/|\.tsx?$|\.jsx?$|\.css(?:\?|$)|\.map(?:\?|$)|\/@react-refresh(?:\?|$))/;
const routes = [
  { name: 'dashboard', path: '/app/dashboard' },
  { name: 'users', path: '/app/users' },
  { name: 'courses', path: '/app/courses' },
  { name: 'groups', path: '/app/groups' },
  { name: 'schedule', path: '/app/schedule' },
  { name: 'payments', path: '/app/payments' },
  { name: 'settings', path: '/app/profile' },
];
const screenshotWidths = new Set([360, 390, 430, 768]);
const screenshotDir = path.resolve('reports/responsive-protected');

const owner = {
  id: 'u-owner',
  username: 'temp_owner_test_with_long_name',
  role: 'owner',
  firstName: 'Temp',
  lastName: 'Owner',
  isActive: true,
  email: 'owner@example.com',
  phoneNumber: '+998901234567',
};
const teacher = { id: 'u-teacher', username: 'teacher_long_name', role: 'teacher', firstName: 'LongNamed', lastName: 'Teacher', isActive: true };
const student = { id: 'u-student', username: 'student_long_name', role: 'student', firstName: 'LongNamed', lastName: 'Student', isActive: true, email: 'student@example.com', phoneNumber: '+998901111111' };
const course = { id: 'c-1', name: 'IELTS Intensive With Long Course Name', description: 'Evening upper-intermediate group with a long note', price: 1200000, teacherId: teacher, students: [student] };
const group = { id: 'g-1', name: 'Group Alpha With Long Name', course, teacher, students: [student] };
const room = { id: 'r-1', name: 'Room 101 Long Auditorium Name', capacity: 24, type: 'classroom', isAvailable: true, description: 'Main classroom' };
const schedule = { id: 's-1', date: new Date().toISOString(), timeStart: new Date().toISOString(), timeEnd: new Date(Date.now() + 3600000).toISOString(), course, room, teacher, students: [student], group };
const payment = { id: 'p-1', amount: 1200000, paidAt: new Date().toISOString(), status: 'pending', student, course, courseId: course, method: 'cash' };
const attendance = { id: 'a-1', date: new Date().toISOString(), status: 'present', userId: student, scheduleId: schedule };
const grade = { id: 'gr-1', userId: student, subject: 'English With Long Subject', score: 95, date: new Date().toISOString() };
const homework = { id: 'h-1', userId: student, date: new Date().toISOString(), tasks: ['Read a long chapter and complete exercises'], completed: false };

function apiPayload(url) {
  const { pathname } = new URL(url);
  if (pathname.endsWith('/auth/login')) return { token: 'qa-token', refreshToken: 'qa-refresh', role: owner.role, user: owner };
  if (pathname.endsWith('/auth/me') || pathname.endsWith('/users/me')) return owner;
  if (pathname.endsWith('/auth/logout')) return { message: 'ok' };
  if (pathname.endsWith('/users') || pathname.endsWith('/users/students')) return [owner, teacher, student];
  if (pathname.endsWith('/courses')) return [course];
  if (pathname.endsWith('/groups')) return [group];
  if (pathname.endsWith('/rooms')) return [room];
  if (pathname.endsWith('/schedule') || pathname.endsWith('/schedule/me') || pathname.includes('/schedule/user/')) return [schedule];
  if (pathname.endsWith('/payments') || pathname.endsWith('/payments/me')) return [payment];
  if (pathname.endsWith('/attendance/me') || pathname.includes('/attendance/user/')) return [attendance];
  if (pathname.endsWith('/grades/me') || pathname.includes('/grades/user/')) return [grade];
  if (pathname.endsWith('/homework/me') || pathname.includes('/homework/user/')) return [homework];
  if (pathname.endsWith('/notifications')) return { id: 'n-1', message: 'ok' };
  return [];
}

function isBackendApiRequest(url) {
  const { origin, pathname } = new URL(url);
  if (!backendOrigins.has(origin)) return false;
  return ['/auth', '/users', '/courses', '/groups', '/rooms', '/schedule', '/payments', '/attendance', '/grades', '/homework', '/notifications']
    .some(prefix => pathname.startsWith(prefix) || pathname.includes(prefix));
}

function isFrontendDevRequest(url) {
  const { origin, pathname } = new URL(url);
  return origin === appOrigin || frontendModulePattern.test(pathname);
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, response => {
      let data = '';
      response.on('data', chunk => {
        data += chunk;
      });
      response.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function connect() {
  const tabs = await getJson(`${cdpBaseUrl}/json/list`);
  const tab = tabs.find(item => item.type === 'page') ?? tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  const pending = new Map();
  const debug = {
    mockedEndpoints: [],
    continuedFrontendRequests: [],
    failedNetworkRequests: [],
    consoleErrors: [],
  };
  let id = 0;

  function send(method, params = {}) {
    return new Promise(resolve => {
      id += 1;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Fetch.requestPaused') {
      const url = message.params.request.url;
      if (isFrontendDevRequest(url) || !isBackendApiRequest(url)) {
        if (isFrontendDevRequest(url)) {
          debug.continuedFrontendRequests.push(url);
        }
        void send('Fetch.continueRequest', { requestId: message.params.requestId });
        return;
      }

      const body = JSON.stringify({ success: true, data: apiPayload(url) });
      debug.mockedEndpoints.push(url);
      void send('Fetch.fulfillRequest', {
        requestId: message.params.requestId,
        responseCode: 200,
        responseHeaders: [
          { name: 'content-type', value: 'application/json' },
          { name: 'access-control-allow-origin', value: appOrigin },
          { name: 'access-control-allow-credentials', value: 'true' },
          { name: 'access-control-allow-headers', value: 'authorization, content-type' },
          { name: 'access-control-allow-methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
        ],
        body: Buffer.from(body).toString('base64'),
      });
      return;
    }

    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
      debug.consoleErrors.push({
        type: message.params.type,
        args: message.params.args.map(arg => arg.value ?? arg.description ?? '').join(' '),
      });
    }

    if (message.method === 'Network.loadingFailed') {
      debug.failedNetworkRequests.push({
        requestId: message.params.requestId,
        errorText: message.params.errorText,
        canceled: message.params.canceled,
      });
    }

    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };

  await new Promise(resolve => {
    ws.onopen = resolve;
  });

  return { ws, send, debug };
}

async function waitForAppRoute(send, routePath) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const result = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `({
        href: location.href,
        pathname: location.pathname,
        hasTopbar: !!document.querySelector('.app-topbar'),
        hasLogin: !!document.querySelector('.login-card'),
        loading: document.body.innerText.includes('Loading')
      })`,
    });
    const value = result.result.result.value;
    if (value.pathname === routePath && value.hasTopbar && !value.loading) {
      return value;
    }
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  const finalResult = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `({ href: location.href, pathname: location.pathname, text: document.body.innerText.slice(0, 240), hasTopbar: !!document.querySelector('.app-topbar'), hasLogin: !!document.querySelector('.login-card') })`,
  });
  return finalResult.result.result.value;
}

async function main() {
  await mkdir(screenshotDir, { recursive: true });
  const { ws, send, debug } = await connect();

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      localStorage.setItem('token', 'qa-token');
      localStorage.setItem('refreshToken', 'qa-refresh');
      localStorage.setItem('ibrat.crm.language', 'ru');
      localStorage.setItem('ibrat.crm.theme', 'dark');
    `,
  });
  await send('Page.navigate', { url: `${appBaseUrl}/login` });
  await new Promise(resolve => setTimeout(resolve, 800));
  await send('Runtime.evaluate', {
    expression: `
      localStorage.clear();
      localStorage.setItem('token', 'qa-token');
      localStorage.setItem('refreshToken', 'qa-refresh');
      localStorage.setItem('ibrat.crm.language', 'ru');
      localStorage.setItem('ibrat.crm.theme', 'dark');
    `,
  });
  await send('Page.reload', { ignoreCache: true });
  await new Promise(resolve => setTimeout(resolve, 800));

  const results = [];
  for (const route of routes) {
    for (const width of widths) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('token', 'qa-token');
          localStorage.setItem('refreshToken', 'qa-refresh');
          localStorage.setItem('ibrat.crm.language', 'ru');
          localStorage.setItem('ibrat.crm.theme', 'dark');
        `,
      });
      await send('Page.navigate', { url: `${appBaseUrl}${route.path}` });
      const opened = await waitForAppRoute(send, route.path);
      const debugState = await send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => ({
          localStorage: Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])),
          currentUrl: location.href,
          pathname: location.pathname,
          bodyTextPreview: document.body.innerText.slice(0, 500),
          appShellFound: !!document.querySelector('.app-shell'),
          topbarFound: !!document.querySelector('.app-topbar'),
          loginFound: !!document.querySelector('.login-card'),
        }))()`,
      });
      const audit = await send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const root = document.documentElement;
          const body = document.body;
          const viewport = root.clientWidth;
          const wideElements = [...document.querySelectorAll('body *')]
            .filter(el => {
              const rect = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              const allowed = el.classList.contains('table-shell__content') || style.overflowX === 'auto' || style.position === 'fixed';
              return !allowed && rect.width > viewport + 1;
            })
            .slice(0, 6)
            .map(el => ({ className: String(el.className || ''), width: Math.round(el.getBoundingClientRect().width), text: (el.textContent || '').trim().slice(0, 60) }));
          const overflowElements = [...document.querySelectorAll('body *')]
            .filter(el => {
              const rect = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              const hiddenTableHead = el.closest('thead') && getComputedStyle(el.closest('thead')).position === 'absolute';
              const allowed = el.classList.contains('table-shell__content') || style.overflowX === 'auto' || style.textOverflow === 'ellipsis';
              return !hiddenTableHead && !allowed && rect.width > 8 && style.position !== 'fixed' && el.scrollWidth > el.clientWidth + 3;
            })
            .slice(0, 6)
            .map(el => ({ className: String(el.className || ''), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, text: (el.textContent || '').trim().slice(0, 60) }));
          return {
            horizontalOverflow: root.scrollWidth > root.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1,
            rootScrollWidth: root.scrollWidth,
            rootClientWidth: root.clientWidth,
            wideElements,
            overflowElements,
          };
        })()`,
      });

      let screenshot = null;
      if (screenshotWidths.has(width)) {
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        screenshot = path.join(screenshotDir, `${route.name}-${width}.png`);
        await writeFile(screenshot, Buffer.from(shot.result.data, 'base64'));
      }

      results.push({
        page: route.name,
        expectedPath: route.path,
        width,
        protectedRouteOpened: opened.pathname === route.path && opened.hasTopbar === true,
        currentUrl: opened.href,
        debug: debugState.result.result.value,
        horizontalOverflow: audit.result.result.value.horizontalOverflow,
        elementsWiderThanViewport: audit.result.result.value.wideElements,
        internalOverflowElements: audit.result.result.value.overflowElements,
        screenshot,
      });
    }
  }

  ws.close();
  const summary = {
    protectedRoutesOpenedSuccessfully: results.every(item => item.protectedRouteOpened),
    screenshotsSaved: true,
    screenshotDir,
    debug: {
      appBaseUrl,
      appOrigin,
      backendOrigins: [...backendOrigins],
      mockedEndpoints: [...new Set(debug.mockedEndpoints)].sort(),
      continuedFrontendRequestsSample: [...new Set(debug.continuedFrontendRequests)].slice(0, 30),
      consoleErrors: debug.consoleErrors,
      failedNetworkRequests: debug.failedNetworkRequests,
    },
    results,
    knownIssues: results
      .filter(item => !item.protectedRouteOpened || item.horizontalOverflow || item.elementsWiderThanViewport.length || item.internalOverflowElements.length)
      .map(item => ({
        page: item.page,
        width: item.width,
        currentUrl: item.currentUrl,
        debug: item.debug,
        protectedRouteOpened: item.protectedRouteOpened,
        horizontalOverflow: item.horizontalOverflow,
        elementsWiderThanViewport: item.elementsWiderThanViewport,
        internalOverflowElements: item.internalOverflowElements,
      })),
  };

  const reportPath = path.join(screenshotDir, 'report.json');
  await writeFile(reportPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({
    protectedRoutesOpenedSuccessfully: summary.protectedRoutesOpenedSuccessfully,
    screenshotsSaved: summary.screenshotsSaved,
    screenshotDir,
    reportPath,
    checked: results.length,
    knownIssueCount: summary.knownIssues.length,
    pages: routes.map(route => ({
      page: route.name,
      urls: [...new Set(results.filter(item => item.page === route.name).map(item => item.currentUrl))],
      opened: results.filter(item => item.page === route.name).every(item => item.protectedRouteOpened),
      horizontalOverflow: results.filter(item => item.page === route.name).some(item => item.horizontalOverflow),
      elementsWiderThanViewport: results.filter(item => item.page === route.name).reduce((sum, item) => sum + item.elementsWiderThanViewport.length, 0),
      internalOverflowElements: results.filter(item => item.page === route.name).reduce((sum, item) => sum + item.internalOverflowElements.length, 0),
    })),
    mockedEndpoints: [...new Set(debug.mockedEndpoints)].sort(),
    consoleErrorCount: debug.consoleErrors.length,
    failedNetworkRequestCount: debug.failedNetworkRequests.length,
  }, null, 2));
  if (!summary.protectedRoutesOpenedSuccessfully || summary.knownIssues.length) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
