import { describe, expect, it } from 'vitest';
import { friendlyAuthError, isEmailNotConfirmed } from './authErrors';

describe('friendlyAuthError', () => {
  it('maps known Supabase error codes', () => {
    expect(friendlyAuthError({ code: 'invalid_credentials', message: 'x' }, 'fb')).toBe('E-mail ou senha incorretos.');
    expect(friendlyAuthError({ code: 'over_email_send_rate_limit', message: 'x' }, 'fb')).toMatch(/Muitos e-mails/);
  });

  it('maps known English messages without a code', () => {
    expect(friendlyAuthError(new Error('Invalid login credentials'), 'fb')).toBe('E-mail ou senha incorretos.');
    expect(friendlyAuthError(new Error('User already registered'), 'fb')).toMatch(/Já existe uma conta/);
    expect(friendlyAuthError(new Error('Failed to fetch'), 'fb')).toMatch(/Sem conexão/);
  });

  it('keeps the wait time from throttling messages', () => {
    const err = {
      code: 'over_email_send_rate_limit',
      message: 'For security purposes, you can only request this after 42 seconds.',
    };
    expect(friendlyAuthError(err, 'fb')).toBe('Por segurança, aguarde 42 segundos antes de tentar de novo.');
  });

  it('keeps messages it does not recognize and falls back when empty', () => {
    expect(friendlyAuthError(new Error('Informe seu nome completo.'), 'fb')).toBe('Informe seu nome completo.');
    expect(friendlyAuthError(null, 'fb')).toBe('fb');
  });

  it('detects unconfirmed email by code or message', () => {
    expect(isEmailNotConfirmed({ code: 'email_not_confirmed', message: '' })).toBe(true);
    expect(isEmailNotConfirmed(new Error('Email not confirmed'))).toBe(true);
    expect(isEmailNotConfirmed({ code: 'invalid_credentials', message: 'x' })).toBe(false);
  });
});
