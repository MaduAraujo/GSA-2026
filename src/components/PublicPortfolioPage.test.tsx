import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PublicPortfolio } from '../shared/publicPortfolio';
import { PublicPortfolioPage } from './PublicPortfolioPage';
import { renderWithProviders as render } from '../test/render';

const { getPublicPortfolio } = vi.hoisted(() => ({ getPublicPortfolio: vi.fn() }));

vi.mock('../services/publicPortfolioApi', () => ({ getPublicPortfolio }));

const portfolio = (overrides: Partial<PublicPortfolio> = {}): PublicPortfolio => ({
  profile: { name: 'Ana Souza', role: 'Embaixadora', university: 'USP', avatarUrl: '' },
  certificates: [],
  badges: [],
  ...overrides,
});

const cert = (overrides: Partial<PublicPortfolio['certificates'][number]> = {}) => ({
  id: 'c1',
  title: 'Google Cloud Fundamentals',
  issuer: 'Google',
  issueDate: '2026-03-01',
  description: '',
  ...overrides,
});

describe('PublicPortfolioPage', () => {
  it('shows a "not found" message when the slug does not resolve to a public profile', async () => {
    getPublicPortfolio.mockResolvedValue(null);
    render(<PublicPortfolioPage slug="unknown-slug" />);
    expect(await screen.findByText('Portfólio não encontrado')).toBeInTheDocument();
    expect(getPublicPortfolio).toHaveBeenCalledWith('unknown-slug');
  });

  it('shows the same "not found" message on a fetch error', async () => {
    getPublicPortfolio.mockRejectedValue(new Error('network error'));
    render(<PublicPortfolioPage slug="broken" />);
    expect(await screen.findByText('Portfólio não encontrado')).toBeInTheDocument();
  });

  it('renders the identity and certificates, without bio or study hours', async () => {
    getPublicPortfolio.mockResolvedValue(portfolio({ certificates: [cert()] }));
    render(<PublicPortfolioPage slug="ana" />);

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Embaixadora • USP')).toBeInTheDocument();
    expect(screen.getByText('Google Cloud Fundamentals')).toBeInTheDocument();
    expect(screen.queryByText('Estudo')).not.toBeInTheDocument();
  });

  it('never renders a javascript: URI as the public credential link (XSS guard)', async () => {
    getPublicPortfolio.mockResolvedValue(
      portfolio({ certificates: [cert({ credentialUrl: 'javascript:alert(document.cookie)' })] }),
    );
    render(<PublicPortfolioPage slug="ana" />);

    expect(await screen.findByText('Google Cloud Fundamentals')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Verificar/ })).not.toBeInTheDocument();
  });

  it('renders an http(s) credential link', async () => {
    getPublicPortfolio.mockResolvedValue(
      portfolio({ certificates: [cert({ credentialUrl: 'https://credential.example.com/abc' })] }),
    );
    render(<PublicPortfolioPage slug="ana" />);

    const link = await screen.findByRole('link', { name: /Verificar/ });
    expect(link).toHaveAttribute('href', 'https://credential.example.com/abc');
  });

  it('shows the featured badges', async () => {
    getPublicPortfolio.mockResolvedValue(
      portfolio({ badges: [{ id: 'b1', fileName: 'gemini-expert.png', url: 'https://signed.example/b1' }] }),
    );
    render(<PublicPortfolioPage slug="ana" />);

    expect(await screen.findByRole('heading', { name: 'Badges em destaque' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Gemini expert' })).toHaveAttribute('src', 'https://signed.example/b1');
  });

  it('hides the badges section when none are featured', async () => {
    getPublicPortfolio.mockResolvedValue(portfolio());
    render(<PublicPortfolioPage slug="ana" />);

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Badges em destaque' })).not.toBeInTheDocument();
  });
});
