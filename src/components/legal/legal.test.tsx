import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrivacyPage } from './PrivacyPage';
import { TermsPage } from './TermsPage';

describe('legal pages', () => {
  it('renders the privacy policy with the Google sign-in section and links home', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Login com o Google/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Voltar/ })).toHaveAttribute('href', '/');
  });

  it('renders the terms of use and links to the privacy policy', () => {
    render(<TermsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Termos de Uso' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('href', '/privacidade');
  });
});
