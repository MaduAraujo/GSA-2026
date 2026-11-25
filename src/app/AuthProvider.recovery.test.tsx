import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { auth } = vi.hoisted(() => ({
  auth: {
    verifyOtp: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signOut: vi.fn(),
  },
}));

vi.mock('../services/supabaseClient', () => ({ supabase: { auth } }));

const session = { user: { id: 'user-1' }, access_token: 'token' };

async function renderFrom(url: string) {
  window.history.replaceState({}, '', url);
  vi.resetModules();
  const { AuthProvider, useAuth } = await import('./AuthProvider');
  const redirect = await import('../lib/authRedirect');
  const Probe = () => {
    const { session: s, isRecovery, isLoading } = useAuth();
    if (isLoading) return <p>carregando</p>;
    return <p>{`sessao:${s ? 'sim' : 'nao'} recuperacao:${isRecovery ? 'sim' : 'nao'}`}</p>;
  };
  render(
    <StrictMode>
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
  return redirect;
}

describe('AuthProvider — recovery link with token_hash', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => window.history.replaceState({}, '', '/'));

  it('verifies the token, enters recovery mode and cleans the URL', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session }, error: null });
    auth.getSession.mockResolvedValue({ data: { session } });

    await renderFrom('/redefinir-senha?token_hash=abc123&type=recovery');

    expect(await screen.findByText('sessao:sim recuperacao:sim')).toBeInTheDocument();
    expect(auth.verifyOtp).toHaveBeenCalledTimes(1);
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'abc123', type: 'recovery' });
    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/redefinir-senha');
  });

  it('flags an expired link instead of entering recovery mode', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: null }, error: { code: 'otp_expired' } });
    auth.getSession.mockResolvedValue({ data: { session: null } });

    const redirect = await renderFrom('/redefinir-senha?token_hash=velho&type=recovery');

    expect(await screen.findByText('sessao:nao recuperacao:nao')).toBeInTheDocument();
    expect(redirect.hasPendingLinkError()).toBe(true);
  });

  it('does not call verifyOtp on a normal visit', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });

    await renderFrom('/entrar');

    expect(await screen.findByText('sessao:nao recuperacao:nao')).toBeInTheDocument();
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });
});
