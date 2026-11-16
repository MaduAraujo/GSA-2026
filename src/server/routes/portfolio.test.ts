import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

type Result = { data: unknown; error: unknown };

function chain(result: Result) {
  const c: Record<string, unknown> = {
    then: (resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  for (const m of ['select', 'eq', 'order']) c[m] = vi.fn(() => c);
  return c;
}

function mockAdmin(tables: Record<string, Result>, createSignedUrls = vi.fn()) {
  const chains: Record<string, ReturnType<typeof chain>> = {};
  vi.doMock('@supabase/supabase-js', () => ({
    createClient: () => ({
      from: (table: string) => (chains[table] = chain(tables[table] ?? { data: null, error: null })),
      storage: { from: () => ({ createSignedUrls }) },
    }),
  }));
  return { chains, createSignedUrls };
}

async function loadApp() {
  process.env.VITE_SUPABASE_URL = 'https://proj.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
  return (await import('../app')).app;
}

describe('GET /api/portfolio/:slug', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    vi.doUnmock('@supabase/supabase-js');
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns 503 when the service role key is not configured', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    const { app } = await import('../app');
    const res = await request(app).get('/api/portfolio/ana-1234');
    expect(res.status).toBe(503);
  });

  it('returns 404 for malformed slugs without touching the database', async () => {
    const { chains } = mockAdmin({});
    const app = await loadApp();
    const res = await request(app).get('/api/portfolio/ana%20souza');
    expect(res.status).toBe(404);
    expect(chains.profiles).toBeUndefined();
  });

  it('returns 404 when no public profile has that slug', async () => {
    const { chains } = mockAdmin({ profiles: { data: null, error: null } });
    const app = await loadApp();
    const res = await request(app).get('/api/portfolio/ana-1234');
    expect(res.status).toBe(404);
    expect(chains.profiles!.eq).toHaveBeenCalledWith('public_slug', 'ana-1234');
    expect(chains.profiles!.eq).toHaveBeenCalledWith('is_public', true);
  });

  it('returns only identity, certificates and favorite badges with signed URLs', async () => {
    const createSignedUrls = vi.fn().mockResolvedValue({
      data: [{ path: 'u1/earned-badges/1-b.png', signedUrl: 'https://signed/b' }],
      error: null,
    });
    const { chains } = mockAdmin(
      {
        profiles: {
          data: { id: 'u1', name: 'Ana', role: 'Embaixadora', university: 'USP', avatar_url: null },
          error: null,
        },
        certificates: {
          data: [
            {
              id: 'c1',
              title: 'Cloud',
              issuer: 'Google',
              issue_date: '2026-01-01',
              description: 'd',
              hours: 2,
              minutes: null,
              credential_url: null,
            },
          ],
          error: null,
        },
        earned_badges: { data: [{ id: 'b1', file_name: 'b.png', file_path: 'u1/earned-badges/1-b.png' }], error: null },
      },
      createSignedUrls,
    );
    const app = await loadApp();

    const res = await request(app).get('/api/portfolio/ana-1234');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({
      profile: { name: 'Ana', role: 'Embaixadora', university: 'USP', avatarUrl: '' },
      certificates: [
        { id: 'c1', title: 'Cloud', issuer: 'Google', issueDate: '2026-01-01', description: 'd', hours: 2 },
      ],
      badges: [{ id: 'b1', fileName: 'b.png', url: 'https://signed/b' }],
    });
    expect(chains.profiles!.select).toHaveBeenCalledWith('id, name, role, university, avatar_url');
    expect(chains.earned_badges!.eq).toHaveBeenCalledWith('is_favorite', true);
    expect(chains.certificates!.eq).toHaveBeenCalledWith('show_in_portfolio', true);
    expect(chains.earned_badges!.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(createSignedUrls).toHaveBeenCalledWith(['u1/earned-badges/1-b.png'], 3600);
  });
});
