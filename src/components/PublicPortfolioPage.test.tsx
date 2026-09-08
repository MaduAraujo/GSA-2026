import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PublicPortfolioPage } from './PublicPortfolioPage';
import { makeCertificate, makeProfile } from '../test/factories';

const { getPublicProfileBySlug, getPublicCertificates } = vi.hoisted(() => ({
  getPublicProfileBySlug: vi.fn(),
  getPublicCertificates: vi.fn(),
}));

vi.mock('../services/supabaseStorage', () => ({
  SupabaseStorageService: { getPublicProfileBySlug, getPublicCertificates },
}));

describe('PublicPortfolioPage', () => {
  it('shows a "not found" message when the slug does not resolve to a public profile', async () => {
    getPublicProfileBySlug.mockResolvedValue(null);
    render(<PublicPortfolioPage slug="unknown-slug" />);
    expect(await screen.findByText('Portfólio não encontrado')).toBeInTheDocument();
  });

  it('shows the same "not found" message on a fetch error', async () => {
    getPublicProfileBySlug.mockRejectedValue(new Error('network error'));
    render(<PublicPortfolioPage slug="broken" />);
    expect(await screen.findByText('Portfólio não encontrado')).toBeInTheDocument();
  });

  it('renders the profile and certificates once loaded', async () => {
    getPublicProfileBySlug.mockResolvedValue({ profile: makeProfile({ name: 'Ana Souza' }), userId: 'user-1' });
    getPublicCertificates.mockResolvedValue([makeCertificate({ title: 'Google Cloud Fundamentals' })]);
    render(<PublicPortfolioPage slug="ana" />);

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Google Cloud Fundamentals')).toBeInTheDocument();
  });

  it('never renders a javascript: URI as the public credential link (XSS guard)', async () => {
    getPublicProfileBySlug.mockResolvedValue({ profile: makeProfile(), userId: 'user-1' });
    getPublicCertificates.mockResolvedValue([makeCertificate({ credentialUrl: 'javascript:alert(document.cookie)' })]);
    render(<PublicPortfolioPage slug="ana" />);

    await waitFor(() => expect(screen.queryByText('Nenhum certificado publicado ainda.')).not.toBeInTheDocument());
    expect(screen.queryByRole('link', { name: /Verificar/ })).not.toBeInTheDocument();
  });

  it('renders an http(s) credential link', async () => {
    getPublicProfileBySlug.mockResolvedValue({ profile: makeProfile(), userId: 'user-1' });
    getPublicCertificates.mockResolvedValue([makeCertificate({ credentialUrl: 'https://credential.example.com/abc' })]);
    render(<PublicPortfolioPage slug="ana" />);

    const link = await screen.findByRole('link', { name: /Verificar/ });
    expect(link).toHaveAttribute('href', 'https://credential.example.com/abc');
  });
});
