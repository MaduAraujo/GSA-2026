import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthScreen } from './AuthScreen';

const { signInWithPassword, signUp, resetPasswordForEmail } = vi.hoisted(() => ({
  signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ error: null }),
  resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('../services/supabaseClient', () => ({
  supabase: { auth: { signInWithPassword, signUp, resetPasswordForEmail } },
}));

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

    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'nova@example.com');
    await user.type(document.querySelector('input[autocomplete$="password"]') as HTMLInputElement, '123456');
    await user.click(document.querySelector('form button[type="submit"]') as HTMLButtonElement);

    expect(await screen.findByText(/vazamentos conhecidos/)).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('signs up and shows a confirmation message when the password is not leaked', async () => {
    isPasswordLeaked.mockResolvedValueOnce(false);
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signUp" />);

    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'nova@example.com');
    await user.type(document.querySelector('input[autocomplete$="password"]') as HTMLInputElement, 'senhaSegura1');
    await user.click(document.querySelector('form button[type="submit"]') as HTMLButtonElement);

    expect(signUp).toHaveBeenCalledWith({ email: 'nova@example.com', password: 'senhaSegura1' });
    expect(await screen.findByText(/Conta criada!/)).toBeInTheDocument();
  });

  it('sends a password reset email and shows the confirmation screen', async () => {
    const user = userEvent.setup();
    render(<AuthScreen initialMode="signIn" />);

    await user.click(screen.getByRole('button', { name: 'Esqueceu a senha?' }));
    await user.type(document.querySelector('input[type="email"]') as HTMLInputElement, 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(resetPasswordForEmail).toHaveBeenCalledWith('ana@example.com', expect.objectContaining({ redirectTo: expect.any(String) }));
    expect(await screen.findByText('Verifique seu e-mail')).toBeInTheDocument();
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
});
