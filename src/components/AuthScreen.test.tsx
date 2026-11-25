import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthScreen } from './AuthScreen';

const { signInWithPassword, signUp, resetPasswordForEmail, signInWithOAuth, resend, verifyOtp } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
  signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ data: { user: { identities: [{}] }, session: null }, error: null }),
  resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
  resend: vi.fn().mockResolvedValue({ error: null }),
  verifyOtp: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('../services/supabaseClient', () => ({
  supabase: { auth: { signInWithPassword, signUp, resetPasswordForEmail, signInWithOAuth, resend, verifyOtp } },
}));

const fillSignUp = async (user: ReturnType<typeof userEvent.setup>, email = 'nova@example.com') => {
  await user.type(screen.getByLabelText('Nome completo'), 'Ana Souza');
  await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, email);
  await user.type(document.querySelector('input[autocomplete$="password"]') as HTMLInputElement, 'senhaSegura1');
  await user.click(document.querySelector('form button[type="submit"]') as HTMLButtonElement);
};

const { isPasswordLeaked } = vi.hoisted(() => ({ isPasswordLeaked: vi.fn().mockResolvedValue(false) }));
vi.mock('../utils/passwordSecurity', () => ({ isPasswordLeaked }));

describe('AuthScreen', () => {
  it('signs in with the entered email and password', async () => {
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);

    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'ana@example.com');
    await user.type(document.querySelector('input[autocomplete$="password"]') as HTMLInputElement, 'senha123');
    await user.click(document.querySelector('form button[type="submit"]') as HTMLButtonElement);

    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'senha123' });
  });

  it('shows an error message when sign in fails', async () => {
    signInWithPassword.mockResolvedValueOnce({ error: { message: 'Credenciais inválidas' } });
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);

    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'ana@example.com');
    await user.type(document.querySelector('input[autocomplete$="password"]') as HTMLInputElement, 'senha123');
    await user.click(document.querySelector('form button[type="submit"]') as HTMLButtonElement);

    expect(await screen.findByText('Credenciais inválidas')).toBeInTheDocument();
  });

  it('blocks sign up when the password has appeared in a known breach', async () => {
    isPasswordLeaked.mockResolvedValueOnce(true);
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signUp" />);

    await user.type(screen.getByLabelText('Nome completo'), 'Ana Souza');
    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'nova@example.com');
    await user.type(document.querySelector('input[autocomplete$="password"]') as HTMLInputElement, '123456');
    await user.click(document.querySelector('form button[type="submit"]') as HTMLButtonElement);

    expect(await screen.findByText(/vazamentos conhecidos/)).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('signs up and shows the confirm-email screen when the password is not leaked', async () => {
    isPasswordLeaked.mockResolvedValueOnce(false);
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signUp" />);

    await user.type(screen.getByLabelText('Nome completo'), '  Ana   Souza ');
    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'nova@example.com');
    await user.type(document.querySelector('input[autocomplete$="password"]') as HTMLInputElement, 'senhaSegura1');
    await user.click(document.querySelector('form button[type="submit"]') as HTMLButtonElement);

    expect(signUp).toHaveBeenCalledWith({
      email: 'nova@example.com',
      password: 'senhaSegura1',
      options: { emailRedirectTo: window.location.origin, data: { full_name: 'Ana Souza' } },
    });
    expect(await screen.findByText('Confirme seu e-mail')).toBeInTheDocument();
    expect(screen.getByText('nova@example.com')).toBeInTheDocument();
  });

  it('resends the confirmation email from the confirm-email screen', async () => {
    resend.mockClear();
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signUp" />);
    await fillSignUp(user);

    await user.click(await screen.findByRole('button', { name: 'Reenviar e-mail' }));

    expect(resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'nova@example.com',
      options: { emailRedirectTo: window.location.origin },
    });
    expect(await screen.findByText(/E-mail reenviado/)).toBeInTheDocument();
  });

  it('does not show the confirm-email screen when sign up returns a session', async () => {
    signUp.mockResolvedValueOnce({ data: { user: { identities: [{}] }, session: { access_token: 'x' } }, error: null });
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signUp" />);
    await fillSignUp(user);

    await vi.waitFor(() => expect(signUp).toHaveBeenCalled());
    expect(screen.queryByText('Confirme seu e-mail')).not.toBeInTheDocument();
  });

  it('tells the user when the email already has an account (obfuscated response)', async () => {
    signUp.mockResolvedValueOnce({ data: { user: { identities: [] }, session: null }, error: null });
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signUp" />);
    await fillSignUp(user, 'ja@example.com');

    expect(await screen.findByText(/Já existe uma conta com este e-mail/)).toBeInTheDocument();
    expect(screen.queryByText('Confirme seu e-mail')).not.toBeInTheDocument();
  });

  it('translates the "already registered" error on sign up', async () => {
    signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { code: 'user_already_exists', message: 'User already registered' },
    });
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signUp" />);
    await fillSignUp(user, 'ja@example.com');

    expect(await screen.findByText(/Já existe uma conta com este e-mail/)).toBeInTheDocument();
  });

  it('offers to resend the confirmation when signing in with an unconfirmed email', async () => {
    resend.mockClear();
    signInWithPassword.mockResolvedValueOnce({
      error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
    });
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);

    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'ana@example.com');
    await user.type(document.querySelector('input[autocomplete$="password"]') as HTMLInputElement, 'senha123');
    await user.click(document.querySelector('form button[type="submit"]') as HTMLButtonElement);

    expect(await screen.findByText(/ainda não foi confirmado/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reenviar e-mail de confirmação' }));

    expect(resend).toHaveBeenCalledWith(expect.objectContaining({ type: 'signup', email: 'ana@example.com' }));
    expect(await screen.findByText('Confirme seu e-mail')).toBeInTheDocument();
  });

  it('translates invalid credentials into Portuguese', async () => {
    signInWithPassword.mockResolvedValueOnce({
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);

    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'ana@example.com');
    await user.type(document.querySelector('input[autocomplete$="password"]') as HTMLInputElement, 'errada1');
    await user.click(document.querySelector('form button[type="submit"]') as HTMLButtonElement);

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reenviar e-mail de confirmação' })).not.toBeInTheDocument();
  });

  it('requires first and last name on sign up', async () => {
    signUp.mockClear();
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signUp" />);

    await user.type(screen.getByLabelText('Nome completo'), 'Ana');
    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'nova@example.com');
    await user.type(document.querySelector('input[autocomplete$="password"]') as HTMLInputElement, 'senhaSegura1');
    await user.click(document.querySelector('form button[type="submit"]') as HTMLButtonElement);

    expect(await screen.findByText(/nome e sobrenome/)).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('does not show the name field on sign in', () => {
    render(<AuthScreen initialMode="signIn" />);
    expect(screen.queryByLabelText('Nome completo')).not.toBeInTheDocument();
  });

  it('sends a password reset email and shows the confirmation screen', async () => {
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);

    await user.click(screen.getByRole('button', { name: 'Esqueceu a senha?' }));
    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      'ana@example.com',
      expect.objectContaining({ redirectTo: expect.any(String) }),
    );
    expect(await screen.findByText('Verifique seu e-mail')).toBeInTheDocument();
  });

  it('verifies the emailed recovery code inside the app', async () => {
    verifyOtp.mockClear();
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);

    await user.click(screen.getByRole('button', { name: 'Esqueceu a senha?' }));
    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await user.type(await screen.findByLabelText('Código de verificação'), '12a3 456');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(verifyOtp).toHaveBeenCalledWith({ email: 'ana@example.com', token: '123456', type: 'recovery' });
  });

  it('rejects a short recovery code without calling the API', async () => {
    verifyOtp.mockClear();
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);

    await user.click(screen.getByRole('button', { name: 'Esqueceu a senha?' }));
    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await user.type(await screen.findByLabelText('Código de verificação'), '123');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText(/Digite o código de 6 dígitos/)).toBeInTheDocument();
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('explains when the recovery code is wrong or expired', async () => {
    verifyOtp.mockResolvedValueOnce({ error: { code: 'otp_expired', message: 'Token has expired or is invalid' } });
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);

    await user.click(screen.getByRole('button', { name: 'Esqueceu a senha?' }));
    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await user.type(await screen.findByLabelText('Código de verificação'), '999999');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText(/Código inválido ou expirado/)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);
    const passwordInput = document.querySelector('input[autocomplete$="password"]') as HTMLInputElement;
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByLabelText('Mostrar senha'));
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('calls onBack when the back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<AuthScreen initialMode="signIn" onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: /Voltar/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('starts the Google OAuth flow', async () => {
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);
    await user.click(screen.getByRole('button', { name: 'Entrar com o Google' }));
    expect(signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({ redirectTo: expect.any(String) }),
      }),
    );
  });

  it('shows an error when Google sign in fails', async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: { message: 'Provider is not enabled' } });
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);
    await user.click(screen.getByRole('button', { name: 'Entrar com o Google' }));
    expect(await screen.findByText('Esse método de login não está disponível no momento.')).toBeInTheDocument();
  });
});
