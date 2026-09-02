import { describe, it, expect, vi, afterEach } from 'vitest';
import { isPasswordLeaked } from './passwordSecurity';

async function sha1Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

describe('isPasswordLeaked', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when the k-anonymity range response contains the hash suffix', async () => {
    const password = 'correcthorsebatterystaple';
    const suffix = (await sha1Hex(password)).slice(5);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`${suffix}:123\nAAAA1111BBBB2222CCCC3333DDDD444455555555:1`),
      })
    );

    await expect(isPasswordLeaked(password)).resolves.toBe(true);
  });

  it('returns false when the suffix is absent from the response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('AAAA1111BBBB2222CCCC3333DDDD444455555555:1'),
      })
    );

    await expect(isPasswordLeaked('some-unrelated-password')).resolves.toBe(false);
  });

  it('fails closed (not leaked) when the API request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    await expect(isPasswordLeaked('anything')).resolves.toBe(false);
  });

  it('fails closed when the API responds with a non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, text: () => Promise.resolve('') }));
    await expect(isPasswordLeaked('anything')).resolves.toBe(false);
  });
});
