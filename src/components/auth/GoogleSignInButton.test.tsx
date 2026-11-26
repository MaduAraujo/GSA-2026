import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  delete window.google;
});

async function loadButton() {
  return (await import('./GoogleSignInButton')).GoogleSignInButton;
}

describe('GoogleSignInButton', () => {
  it('renders the fallback when no client id is configured', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    const GoogleSignInButton = await loadButton();
    render(<GoogleSignInButton mode="signIn" onCredential={vi.fn()} fallback={<button>Reserva</button>} />);
    expect(screen.getByRole('button', { name: 'Reserva' })).toBeInTheDocument();
  });

  it('renders the official button and forwards the credential with the raw nonce', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-123.apps.googleusercontent.com');
    let captured: ((r: { credential: string }) => void) | undefined;
    let hashedNonce: string | undefined;
    const initialize = vi.fn((config: { callback: (r: { credential: string }) => void; nonce?: string }) => {
      captured = config.callback;
      hashedNonce = config.nonce;
    });
    const renderButton = vi.fn();
    window.google = { accounts: { id: { initialize, renderButton } } };

    const onCredential = vi.fn();
    const GoogleSignInButton = await loadButton();
    render(<GoogleSignInButton mode="signUp" onCredential={onCredential} fallback={<button>Reserva</button>} />);

    await waitFor(() => expect(renderButton).toHaveBeenCalled());
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'client-123.apps.googleusercontent.com', context: 'signup' }),
    );
    expect(renderButton.mock.calls[0]?.[1]).toMatchObject({
      text: 'signup_with',
      locale: 'pt-BR',
      theme: 'outline',
      shape: 'pill',
    });
    expect(screen.queryByRole('button', { name: 'Reserva' })).not.toBeInTheDocument();

    captured!({ credential: 'id-token' });
    expect(onCredential).toHaveBeenCalledWith('id-token', expect.any(String));
    const rawNonce = onCredential.mock.calls[0]?.[1] as string;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce));
    const expected = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    expect(hashedNonce).toBe(expected);
  });
});
