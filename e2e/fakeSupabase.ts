import type { Page, Route } from '@playwright/test';

export type FakeDb = Record<string, Array<Record<string, unknown>>>;

export const TEST_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'ana@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-01-01T00:00:00.000Z',
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

function applyFilters(rows: Array<Record<string, unknown>>, params: URLSearchParams) {
  let result = rows;
  for (const [key, value] of params) {
    if (value.startsWith('eq.')) {
      const expected = decodeURIComponent(value.slice(3));
      result = result.filter((row) => String(row[key]) === expected);
    }
  }
  return result;
}

export async function fakeSupabase(page: Page, db: FakeDb = {}) {
  const session = {
    access_token: 'e2e-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'e2e-refresh-token',
    user: TEST_USER,
  };

  await page.route('**/auth/v1/token**', (route) => json(route, session));
  await page.route('**/auth/v1/user**', (route) => json(route, TEST_USER));
  await page.route('**/auth/v1/logout**', (route) => route.fulfill({ status: 204 }));

  await page.route('**/storage/v1/**', async (route) => {
    const request = route.request();
    if (request.url().includes('/object/sign/')) {
      const { paths = [] } = (request.postDataJSON() ?? {}) as { paths?: string[] };
      return json(
        route,
        paths.map((path) => ({ path, signedURL: `/object/sign/${path}?token=e2e`, error: null })),
      );
    }
    return json(route, { Key: 'e2e', Id: 'e2e' });
  });

  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const table = url.pathname.split('/rest/v1/')[1]?.split('?')[0] ?? '';
    const rows = (db[table] ??= []);

    switch (request.method()) {
      case 'GET':
        return json(route, applyFilters(rows, url.searchParams));
      case 'POST': {
        const body = request.postDataJSON() as Record<string, unknown> | Array<Record<string, unknown>>;
        for (const row of Array.isArray(body) ? body : [body]) {
          const withDefaults: Record<string, unknown> = { created_at: new Date().toISOString(), ...row };
          const key = 'id' in withDefaults ? 'id' : 'endpoint';
          const index = rows.findIndex((existing) => existing[key] === withDefaults[key]);
          if (index >= 0) rows[index] = { ...rows[index], ...withDefaults };
          else rows.push(withDefaults);
        }
        return route.fulfill({ status: 201, body: '' });
      }
      case 'DELETE': {
        const doomed = new Set(applyFilters(rows, url.searchParams));
        db[table] = rows.filter((row) => !doomed.has(row));
        return route.fulfill({ status: 204, body: '' });
      }
      default:
        return route.fulfill({ status: 204, body: '' });
    }
  });

  return db;
}

export async function signInBeforeLoad(page: Page) {
  await page.addInitScript((user) => {
    const session = {
      access_token: 'e2e-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'e2e-refresh-token',
      user,
    };
    localStorage.setItem('sb-e2e-fake-auth-token', JSON.stringify(session));
  }, TEST_USER);
}

export function profileRow(name = 'Ana Souza') {
  return { id: TEST_USER.id, name, role: 'Embaixadora', email: TEST_USER.email, is_public: false };
}
