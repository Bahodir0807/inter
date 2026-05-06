import { mkdirSync, writeFileSync } from 'node:fs';

const apiUrl = (process.env.SMOKE_API_URL ?? process.env.VITE_API_URL ?? 'https://b.sultonoway.uz').replace(/\/$/, '');
const password = process.env.SMOKE_PASSWORD ?? 'ChangeMe123!';
const allowMutations = process.env.SMOKE_MUTATE === 'true';

const credentials = {
  admin: {
    username: process.env.SMOKE_ADMIN_USERNAME ?? 'branch_admin',
    password: process.env.SMOKE_ADMIN_PASSWORD ?? password,
  },
  teacher: {
    username: process.env.SMOKE_TEACHER_USERNAME ?? 'teacher',
    password: process.env.SMOKE_TEACHER_PASSWORD ?? password,
  },
  student: {
    username: process.env.SMOKE_STUDENT_USERNAME ?? 'student',
    password: process.env.SMOKE_STUDENT_PASSWORD ?? password,
  },
  panda: {
    username: process.env.SMOKE_PANDA_USERNAME ?? 'panda',
    password: process.env.SMOKE_PANDA_PASSWORD ?? password,
  },
};

const expectedAccess = {
  admin: {
    ok: ['/auth/me', '/users?page=1&limit=5', '/courses?page=1&limit=5', '/groups?page=1&limit=5', '/schedule?page=1&limit=5', '/rooms?page=1&limit=5', '/payments?page=1&limit=5', '/roles?page=1&limit=5', '/statistics?page=1&limit=5', '/phone-request/pending?page=1&limit=5'],
    forbidden: ['/attendance/me', '/grades/me', '/homework/me'],
  },
  teacher: {
    ok: ['/auth/me', '/users/students?page=1&limit=5', '/courses?page=1&limit=5', '/groups?page=1&limit=5', '/schedule/me', '/rooms?page=1&limit=5'],
    forbidden: ['/users?page=1&limit=5', '/payments?page=1&limit=5', '/roles?page=1&limit=5', '/statistics?page=1&limit=5'],
  },
  student: {
    ok: ['/auth/me', '/courses?page=1&limit=5', '/groups?page=1&limit=5', '/schedule/me', '/payments/me?page=1&limit=5', '/attendance/me', '/grades/me', '/homework/me'],
    forbidden: ['/users?page=1&limit=5', '/payments?page=1&limit=5', '/roles?page=1&limit=5', '/statistics?page=1&limit=5'],
  },
  panda: {
    ok: ['/auth/me', '/users?page=1&limit=5', '/courses?page=1&limit=5', '/groups?page=1&limit=5', '/schedule?page=1&limit=5', '/rooms?page=1&limit=5', '/payments?page=1&limit=5', '/roles?page=1&limit=5', '/statistics?page=1&limit=5', '/phone-request/pending?page=1&limit=5'],
    forbidden: ['/attendance/me', '/grades/me', '/homework/me'],
  },
};

const results = [];

function record(name, status, detail = '') {
  results.push({ name, status, detail });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

async function login(role) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials[role]),
  });
  assert(result.status === 201 || result.status === 200, `${role} login failed: ${result.status} ${JSON.stringify(result.body)}`);
  const payload = result.body?.data ?? result.body;
  assert(payload?.token, `${role} login did not return token`);
  return payload.token;
}

async function expectOk(role, token, path) {
  const result = await request(path, { token });
  assert(result.status >= 200 && result.status < 300, `${role} expected OK for ${path}, got ${result.status}`);
  if (Array.isArray((result.body?.data ?? result.body))) {
    const meta = result.body?.meta;
    if (path.includes('page=') && meta?.pagination) {
      assert(typeof meta.pagination.page === 'number', `${path} missing numeric pagination.page`);
    }
  }
}

async function expectForbidden(role, token, path) {
  const result = await request(path, { token });
  assert([401, 403].includes(result.status), `${role} expected forbidden for ${path}, got ${result.status}`);
}

async function roomsCrud(token) {
  const suffix = Date.now();
  const create = await request('/rooms', {
    method: 'POST',
    token,
    body: JSON.stringify({
      name: `Smoke Room ${suffix}`,
      capacity: 12,
      type: 'classroom',
      isAvailable: true,
      description: 'Created by frontend live smoke test',
    }),
  });
  assert(create.status === 201 || create.status === 200, `rooms create failed: ${create.status} ${JSON.stringify(create.body)}`);
  const room = create.body?.data ?? create.body;
  assert(room?.id, 'rooms create did not return id');

  const list = await request(`/rooms?page=1&limit=5&search=${encodeURIComponent(room.name)}`, { token });
  assert(list.status === 200, `rooms search failed: ${list.status}`);
  assert(list.body?.meta?.pagination, 'rooms search missing pagination meta');

  const update = await request(`/rooms/${room.id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ capacity: 14, isAvailable: false }),
  });
  assert(update.status === 200, `rooms update failed: ${update.status}`);

  const byId = await request(`/rooms/${room.id}`, { token });
  assert(byId.status === 200, `rooms getById failed: ${byId.status}`);

  const remove = await request(`/rooms/${room.id}`, { method: 'DELETE', token });
  assert(remove.status === 200, `rooms delete failed: ${remove.status}`);
}

async function paymentsFilters(token) {
  const result = await request('/payments?page=1&limit=5&status=pending&sortBy=paidAt&sortOrder=desc', { token });
  assert(result.status === 200, `payments filters failed: ${result.status}`);
  assert(result.body?.meta?.pagination, 'payments filters missing pagination meta');
}

async function expiredTokenCheck() {
  const result = await request('/auth/me', { token: 'expired.invalid.token' });
  assert(result.status === 401, `expired token expected 401, got ${result.status}`);
  record('expired token returns 401', 'passed');
}

async function run() {
  console.log(`Smoke API: ${apiUrl}`);
  await expiredTokenCheck();
  const tokens = {};
  for (const role of Object.keys(credentials)) {
    tokens[role] = await login(role);
    for (const path of expectedAccess[role].ok) {
      await expectOk(role, tokens[role], path);
      record(`${role} OK ${path}`, 'passed');
    }
    for (const path of expectedAccess[role].forbidden) {
      await expectForbidden(role, tokens[role], path);
      record(`${role} forbidden ${path}`, 'passed');
    }
    console.log(`${role}: auth, allowed endpoints, forbidden endpoints OK`);
  }

  if (allowMutations) {
    await roomsCrud(tokens.admin);
    record('rooms CRUD', 'passed');
    console.log('rooms: create/search/update/getById/delete OK');
  } else {
    console.log('rooms: CRUD skipped; set SMOKE_MUTATE=true to run mutating checks');
  }
  await paymentsFilters(tokens.admin);
  record('payments filters/pagination', 'passed');
  console.log('payments: filters/pagination OK');
}

run().catch((error) => {
  record('live smoke failed', 'failed', error.message);
  writeReports('failed');
  console.error(error.message);
  process.exit(1);
});

function writeReports(status) {
  mkdirSync(new URL('../reports', import.meta.url), { recursive: true });
  const reportName = allowMutations ? 'smoke-live-mutating' : 'smoke-live-readonly';
  const report = {
    type: 'live-smoke',
    status,
    apiUrl,
    mutate: allowMutations,
    timestamp: new Date().toISOString(),
    results,
  };
  writeFileSync(new URL(`../reports/${reportName}.json`, import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(
    new URL(`../reports/${reportName}.md`, import.meta.url),
    `# Live Smoke Report\n\nStatus: ${status}\n\nAPI: ${apiUrl}\n\nMutations: ${allowMutations ? 'enabled' : 'disabled'}\n\nGenerated: ${report.timestamp}\n\n${results.map(item => `- ${item.status}: ${item.name}${item.detail ? ` - ${item.detail}` : ''}`).join('\n')}\n`,
  );
}

process.on('beforeExit', (code) => {
  if (code === 0) {
    writeReports('passed');
  }
});
