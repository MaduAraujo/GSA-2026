import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CertificatesModule } from './CertificatesModule';
import { Certificate } from '../types';
import { makeCertificate, makeProfile } from '../test/factories';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

function renderModule(overrides: Partial<React.ComponentProps<typeof CertificatesModule>> = {}) {
  const props = {
    certificates: [] as Certificate[],
    prompts: [],
    posts: [],
    userBadges: [],
    profile: makeProfile(),
    onSaveCertificate: vi.fn().mockResolvedValue(undefined),
    onDeleteCertificate: vi.fn(),
    onCreatePostFromCertificate: vi.fn(),
    ...overrides,
  };
  render(<CertificatesModule {...props} />);
  return props;
}

describe('CertificatesModule', () => {
  it('shows an empty state when there are no certificates', () => {
    renderModule();
    expect(screen.getByText('Nenhum certificado encontrado')).toBeInTheDocument();
  });

  it('filters certificates by search query', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [
        makeCertificate({ id: 'c1', title: 'Google Cloud Fundamentals' }),
        makeCertificate({ id: 'c2', title: 'Liderança Estudantil', issuer: 'Comunidade Local', skills: ['Liderança'] }),
      ],
    });
    await user.type(document.getElementById('search-certificates-input') as HTMLInputElement, 'cloud');
    expect(screen.getByText('Google Cloud Fundamentals')).toBeInTheDocument();
    expect(screen.queryByText('Liderança Estudantil')).not.toBeInTheDocument();
  });

  it('filters certificates by category chip', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [makeCertificate({ id: 'c1', category: 'Google Cloud', title: 'Cert A' }), makeCertificate({ id: 'c2', category: 'Liderança', title: 'Cert B' })],
    });
    await user.click(screen.getByRole('button', { name: 'Liderança' }));
    expect(screen.getByText('Cert B')).toBeInTheDocument();
    expect(screen.queryByText('Cert A')).not.toBeInTheDocument();
  });

  it('toggles the favorites-only filter', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [makeCertificate({ id: 'c1', title: 'Favorito', isFavorite: true }), makeCertificate({ id: 'c2', title: 'Comum', isFavorite: false })],
    });
    const favBtn = screen.getByRole('button', { name: 'Favoritos' });
    expect(favBtn).toHaveAttribute('aria-pressed', 'false');
    await user.click(favBtn);
    expect(favBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Favorito')).toBeInTheDocument();
    expect(screen.queryByText('Comum')).not.toBeInTheDocument();
  });

  it('toggles a certificate as favorite', async () => {
    const user = userEvent.setup();
    const { onSaveCertificate } = renderModule({ certificates: [makeCertificate({ isFavorite: false })] });
    await user.click(screen.getByLabelText('Favoritar certificado'));
    await waitFor(() => expect(onSaveCertificate).toHaveBeenCalledTimes(1));
    const saved = (onSaveCertificate as ReturnType<typeof vi.fn>).mock.calls[0][0] as Certificate;
    expect(saved.isFavorite).toBe(true);
  });

  it('keeps the submit button disabled until a title is entered, then creates the certificate', async () => {
    const user = userEvent.setup();
    const { onSaveCertificate } = renderModule();
    await user.click(screen.getByLabelText('Novo certificado'));

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await user.type(document.getElementById('cert-form-title') as HTMLInputElement, '  Certificação de IA  ');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(onSaveCertificate).toHaveBeenCalledTimes(1));
    const saved = (onSaveCertificate as ReturnType<typeof vi.fn>).mock.calls[0][0] as Certificate;
    expect(saved.title).toBe('Certificação de IA');
    expect(saved.issuer).toBe('');
  });

  it('asks for confirmation before deleting from the detail view', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { onDeleteCertificate } = renderModule({ certificates: [makeCertificate({ title: 'Cert X' })] });

    await user.click(screen.getByLabelText('Visualizar Detalhes'));
    await user.click(screen.getByLabelText('Excluir certificado'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteCertificate).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('never renders a javascript: URI as the credential validation link (XSS guard)', async () => {
    const user = userEvent.setup();
    renderModule({ certificates: [makeCertificate({ credentialUrl: 'javascript:alert(1)' })] });
    await user.click(screen.getByLabelText('Visualizar Detalhes'));
    expect(screen.queryByRole('link', { name: /Verificar/ })).not.toBeInTheDocument();
  });
});
