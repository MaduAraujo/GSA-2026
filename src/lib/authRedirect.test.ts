import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async (url: string) => {
  window.history.replaceState({}, '', url);
  vi.resetModules();
  return import('./authRedirect');
};

describe('authRedirect', () => {
  afterEach(() => window.history.replaceState({}, '', '/'));

  it('detects a password recovery link', async () => {
    const mod = await load('/#access_token=abc&type=recovery');
    expect(mod.arrivedFromRecoveryLink).toBe(true);
    expect(mod.hasPendingLinkError()).toBe(false);
  });

  it('reads the token hash from a recovery link built by the email template', async () => {
    const mod = await load('/redefinir-senha?token_hash=abc123&type=recovery');
    expect(mod.arrivedFromRecoveryLink).toBe(true);
    expect(mod.recoveryTokenHash).toBe('abc123');
  });

  it('ignores normal visits', async () => {
    const mod = await load('/entrar');
    expect(mod.arrivedFromRecoveryLink).toBe(false);
    expect(mod.recoveryTokenHash).toBeNull();
    expect(mod.consumeLinkError()).toBeNull();
  });

  it('reports an expired link once and cleans the URL', async () => {
    const mod = await load('/#error=access_denied&error_code=otp_expired&error_description=expired');
    expect(mod.hasPendingLinkError()).toBe(true);
    expect(mod.consumeLinkError()).toMatch(/expirou ou já foi usado/);
    expect(window.location.hash).toBe('');
    expect(mod.hasPendingLinkError()).toBe(false);
    expect(mod.consumeLinkError()).toBeNull();
  });
});
