import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

type Entry = { name: string; id: string | null };

function mockSupabase({
  user = { id: 'user-1' },
  tree = {} as Record<string, Entry[]>,
  deleteUserError = null as unknown,
} = {}) {
  const remove = vi.fn((_bucket: string, _paths: string[]) => Promise.resolve({ data: [], error: null }));
  const deleteUser = vi.fn((_id: string) => Promise.resolve({ data: {}, error: deleteUserError }));
  const list = vi.fn((bucket: string, prefix: string) =>
    Promise.resolve({ data: tree[`${bucket}:${prefix}`] ?? [], error: null }),
  );
  vi.doMock('@supabase/supabase-js', () => ({
    createClient: () => ({
      auth: {
        getUser: () => Promise.resolve(user ? { data: { user }, error: null } : { data: { user: null }, error: 'x' }),
        admin: { deleteUser },
      },
      storage: {
        from: (bucket: string) => ({
          list: (prefix: string) => list(bucket, prefix),
          remove: (paths: string[]) => remove(bucket, paths),
        }),
      },
    }),
  }));
  return { remove, deleteUser, list };
}

async function loadApp(withServiceRole = true) {
  process.env.VITE_SUPABASE_URL = 'https://proj.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = withServiceRole ? 'service' : '';
  return (await import('../app')).app;
}

describe('DELETE /api/account', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    vi.doUnmock('@supabase/supabase-js');
    process.env = { ...ORIGINAL_ENV };
  });

  it('requires authentication', async () => {
    mockSupabase();
    const app = await loadApp();
    const res = await request(app).delete('/api/account').send({ confirmation: 'EXCLUIR' });
    expect(res.status).toBe(401);
  });

  it('rejects requests without the confirmation word', async () => {
    const { deleteUser } = mockSupabase();
    const app = await loadApp();
    const res = await request(app)
      .delete('/api/account')
      .set('Authorization', 'Bearer token')
      .send({ confirmation: 'sim' });
    expect(res.status).toBe(400);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('returns 503 when the service role key is missing', async () => {
    mockSupabase();
    const app = await loadApp(false);
    const res = await request(app)
      .delete('/api/account')
      .set('Authorization', 'Bearer token')
      .send({ confirmation: 'EXCLUIR' });
    expect(res.status).toBe(503);
  });

  it('removes the user files recursively and then deletes the auth user', async () => {
    const { remove, deleteUser } = mockSupabase({
      tree: {
        'user-files:user-1': [
          { name: 'avatar.webp', id: 'f1' },
          { name: 'certificates', id: null },
        ],
        'user-files:user-1/certificates': [{ name: 'c1.pdf', id: 'f2' }],
        'prompt-docs:user-1': [{ name: 'doc.docx', id: 'f3' }],
      },
    });
    const app = await loadApp();
    const res = await request(app)
      .delete('/api/account')
      .set('Authorization', 'Bearer token')
      .send({ confirmation: 'EXCLUIR' });

    expect(res.status).toBe(204);
    expect(remove).toHaveBeenCalledWith('user-files', ['user-1/avatar.webp', 'user-1/certificates/c1.pdf']);
    expect(remove).toHaveBeenCalledWith('prompt-docs', ['user-1/doc.docx']);
    expect(deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('reports a failure when the auth user cannot be deleted', async () => {
    mockSupabase({ deleteUserError: new Error('falhou') });
    const app = await loadApp();
    const res = await request(app)
      .delete('/api/account')
      .set('Authorization', 'Bearer token')
      .send({ confirmation: 'EXCLUIR' });
    expect(res.status).toBe(500);
  });
});
