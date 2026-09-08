import { describe, expect, it, vi } from 'vitest';

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { getSession } }),
}));

describe('getAuthHeaders', () => {
  it('returns an empty object when there is no active session', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    const { getAuthHeaders } = await import('./supabaseClient');
    expect(await getAuthHeaders()).toEqual({});
  });

  it('returns a bearer Authorization header when a session token is present', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'the-token' } } });
    const { getAuthHeaders } = await import('./supabaseClient');
    expect(await getAuthHeaders()).toEqual({ Authorization: 'Bearer the-token' });
  });
});
