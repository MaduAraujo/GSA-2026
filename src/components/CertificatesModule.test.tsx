import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../app/ToastProvider';
import { CertificatesModule } from './CertificatesModule';
import { type Certificate } from '../types';
import { makeCertificate, makeProfile } from '../test/factories';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

function renderModule(overrides: Partial<React.ComponentProps<typeof CertificatesModule>> = {}) {
  const props = {
    certificates: [] as Certificate[],
    earnedBadges: [],
    isEarnedBadgesLoading: false,
    profile: makeProfile(),
    onUploadEarnedBadge: vi.fn().mockResolvedValue(undefined),
    onDeleteEarnedBadge: vi.fn().mockResolvedValue(undefined),
    onToggleEarnedBadgeFavorite: vi.fn().mockResolvedValue(undefined),
    onSaveCertificate: vi.fn().mockResolvedValue(undefined),
    onToggleCertificateFavorite: vi.fn().mockResolvedValue(undefined),
    onToggleCertificatePortfolio: vi.fn().mockResolvedValue(undefined),
    onDeleteCertificate: vi.fn(),
    onCreatePostFromCertificate: vi.fn(),
    ...overrides,
  };
  const { unmount } = render(<CertificatesModule {...props} />, { wrapper: ToastProvider });
  return { ...props, unmount };
}

describe('CertificatesModule', () => {
  it('invites the user to add the first certificate when there are none', async () => {
    const user = userEvent.setup();
    renderModule();
    expect(screen.getByText('Adicione seu primeiro certificado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Adicionar certificado' }));
    expect(screen.getByText('Novo Certificado')).toBeInTheDocument();
  });

  it('shows the result count and clears every filter at once', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [
        makeCertificate({ id: 'c1', title: 'Google Cloud Fundamentals' }),
        makeCertificate({ id: 'c2', title: 'Liderança Estudantil' }),
      ],
    });
    await user.type(screen.getByPlaceholderText(/Buscar por título/), 'inexistente');
    expect(screen.getByText('Nenhum certificado encontrado')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 de 2 certificados');

    await user.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0]!);
    expect(screen.getByText('Google Cloud Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Liderança Estudantil')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('explains the empty favorites filter', async () => {
    const user = userEvent.setup();
    renderModule({ certificates: [makeCertificate({ isFavorite: false })] });
    await user.click(screen.getByRole('button', { name: 'Favoritos' }));
    expect(screen.getByText(/ainda não favoritou nenhum certificado/)).toBeInTheDocument();
  });

  it('matches the search against category and description', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [
        makeCertificate({ id: 'c1', title: 'Cert A', category: 'Machine Learning', description: '' }),
        makeCertificate({ id: 'c2', title: 'Cert B', category: 'Outros', description: 'Curso sobre Kubernetes' }),
      ],
    });
    const search = screen.getByPlaceholderText(/Buscar por título/);
    await user.type(search, 'machine');
    expect(screen.getByText('Cert A')).toBeInTheDocument();
    expect(screen.queryByText('Cert B')).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'kubernetes');
    expect(screen.getByText('Cert B')).toBeInTheDocument();
    expect(screen.queryByText('Cert A')).not.toBeInTheDocument();
  });

  it('shows the "Verificável" badge only when the certificate has a verification link', () => {
    renderModule({
      certificates: [
        makeCertificate({ id: 'c1', title: 'Com link', credentialUrl: 'https://example.com/verify' }),
        makeCertificate({ id: 'c2', title: 'Sem link', credentialUrl: undefined }),
      ],
    });
    expect(screen.getAllByText('Verificável')).toHaveLength(1);
  });

  it('remembers the view mode across remounts but not the open certificate', async () => {
    sessionStorage.clear();
    const user = userEvent.setup();
    const certificates = [makeCertificate({ title: 'Cert X' })];
    const { unmount } = renderModule({ certificates });
    await user.click(screen.getByLabelText('Visualização em lista'));
    await user.click(screen.getByRole('button', { name: 'Cert X' }));
    unmount();

    renderModule({ certificates });
    expect(screen.getByLabelText('Visualização em lista')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    sessionStorage.clear();
  });

  it('copies the public portfolio link from the export menu', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    renderModule({ profile: makeProfile({ isPublic: true, publicSlug: 'ana-1234' }) });
    await user.click(screen.getByLabelText('Exportar certificados'));
    await user.click(screen.getByRole('menuitem', { name: /Link público/ }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/p/ana-1234`);
    expect(await screen.findByText('Link copiado!')).toBeInTheDocument();
  });

  it('disables the share link when the portfolio is not public', async () => {
    const user = userEvent.setup();
    renderModule({ profile: makeProfile({ isPublic: false }) });
    await user.click(screen.getByLabelText('Exportar certificados'));
    expect(screen.getByRole('menuitem', { name: /Link público/ })).toBeDisabled();
    expect(screen.getByText('Ative o portfólio público no seu perfil')).toBeInTheDocument();
  });

  it('filters certificates by search query', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [
        makeCertificate({ id: 'c1', title: 'Google Cloud Fundamentals' }),
        makeCertificate({
          id: 'c2',
          title: 'Liderança Estudantil',
          issuer: 'Comunidade Local',
          category: 'Liderança',
          description: 'Oficina de liderança.',
          skills: ['Liderança'],
        }),
      ],
    });
    await user.type(document.getElementById('search-certificates-input') as HTMLInputElement, 'cloud');
    expect(screen.getByText('Google Cloud Fundamentals')).toBeInTheDocument();
    expect(screen.queryByText('Liderança Estudantil')).not.toBeInTheDocument();
  });

  it('filters certificates by category chip', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [
        makeCertificate({ id: 'c1', category: 'Google Cloud', title: 'Cert A' }),
        makeCertificate({ id: 'c2', category: 'Liderança', title: 'Cert B' }),
      ],
    });
    await user.click(screen.getByRole('button', { name: 'Liderança' }));
    expect(screen.getByText('Cert B')).toBeInTheDocument();
    expect(screen.queryByText('Cert A')).not.toBeInTheDocument();
  });

  it('toggles the favorites-only filter', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [
        makeCertificate({ id: 'c1', title: 'Favorito', isFavorite: true }),
        makeCertificate({ id: 'c2', title: 'Comum', isFavorite: false }),
      ],
    });
    const favBtn = screen.getByRole('button', { name: 'Favoritos' });
    expect(favBtn).toHaveAttribute('aria-pressed', 'false');
    await user.click(favBtn);
    expect(favBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Favorito')).toBeInTheDocument();
    expect(screen.queryByText('Comum')).not.toBeInTheDocument();
  });

  it('toggles a certificate as favorite without a full save', async () => {
    const user = userEvent.setup();
    const cert = makeCertificate({ isFavorite: false });
    const { onToggleCertificateFavorite, onSaveCertificate } = renderModule({ certificates: [cert] });
    await user.click(screen.getByLabelText('Favoritar certificado'));
    await waitFor(() => expect(onToggleCertificateFavorite).toHaveBeenCalledWith(cert, true));
    expect(onSaveCertificate).not.toHaveBeenCalled();
  });

  it('fills the star immediately and reverts it when saving fails', async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let reject!: (err: Error) => void;
    renderModule({
      certificates: [makeCertificate({ isFavorite: false })],
      onToggleCertificateFavorite: vi.fn(() => new Promise<void>((_, r) => (reject = r))),
    });
    await user.click(screen.getByLabelText('Favoritar certificado'));
    expect(screen.getByLabelText('Remover dos favoritos')).toHaveAttribute('aria-pressed', 'true');

    reject(new Error('boom'));
    await waitFor(() =>
      expect(screen.getByLabelText('Favoritar certificado')).toHaveAttribute('aria-pressed', 'false'),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível atualizar o favorito');
    errorSpy.mockRestore();
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
    const saved = (onSaveCertificate as ReturnType<typeof vi.fn>).mock.calls[0]![0] as Certificate;
    expect(saved.title).toBe('Certificação de IA');
    expect(saved.issuer).toBe('');
  });

  it('deletes from the detail view only after the undo window closes', async () => {
    const user = userEvent.setup();
    const { onDeleteCertificate } = renderModule({ certificates: [makeCertificate({ id: 'c1', title: 'Cert X' })] });

    await user.click(screen.getByLabelText('Abrir Cert X'));
    await user.click(screen.getByLabelText('Excluir certificado'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Cert X')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Certificado excluído');
    expect(onDeleteCertificate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Fechar notificação' }));
    await waitFor(() => expect(onDeleteCertificate).toHaveBeenCalledWith('c1'));
  });

  it('brings a deleted certificate back when the user clicks "Desfazer"', async () => {
    const user = userEvent.setup();
    const { onDeleteCertificate } = renderModule({ certificates: [makeCertificate({ title: 'Cert X' })] });

    await user.click(screen.getByLabelText('Mais ações para Cert X'));
    await user.click(screen.getByRole('menuitem', { name: 'Excluir' }));
    expect(screen.queryByText('Cert X')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(screen.getByText('Cert X')).toBeInTheDocument();
    expect(onDeleteCertificate).not.toHaveBeenCalled();
  });

  it('offers the same actions menu on the card and in the list view', async () => {
    const user = userEvent.setup();
    const cert = makeCertificate({ title: 'Cert X' });
    const { onCreatePostFromCertificate } = renderModule({ certificates: [cert] });

    await user.click(screen.getByLabelText('Mais ações para Cert X'));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Editar',
      'Gerar post',
      'Ocultar do portfólio',
      'Adicionar ao LinkedIn',
      'Excluir',
    ]);
    await user.click(screen.getByRole('menuitem', { name: 'Gerar post' }));
    expect(onCreatePostFromCertificate).toHaveBeenCalledWith(cert);

    await user.click(screen.getByLabelText('Visualização em lista'));
    await user.click(screen.getByLabelText('Mais ações para Cert X'));
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
    expect(screen.getByText('Editar Certificado')).toBeInTheDocument();
  });

  it('lets the user favorite a certificate from the list view', async () => {
    const user = userEvent.setup();
    const cert = makeCertificate({ title: 'Cert X', isFavorite: false });
    const { onToggleCertificateFavorite } = renderModule({ certificates: [cert] });
    await user.click(screen.getByLabelText('Visualização em lista'));
    await user.click(screen.getByLabelText('Favoritar certificado'));
    await waitFor(() => expect(onToggleCertificateFavorite).toHaveBeenCalledWith(cert, true));
  });

  it('shows the title, issuer and verification status in the detail header', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [
        makeCertificate({ title: 'Cert X', issuer: 'Google', credentialUrl: 'https://example.com/verify' }),
      ],
    });
    await user.click(screen.getByLabelText('Abrir Cert X'));
    const dialog = screen.getByRole('dialog', { name: 'Cert X' });
    expect(dialog).toHaveTextContent('Google');
    expect(screen.getAllByText('Verificável').length).toBeGreaterThan(0);
  });

  it('opens the edit form straight from the detail view', async () => {
    const user = userEvent.setup();
    renderModule({ certificates: [makeCertificate({ title: 'Cert X' })] });

    await user.click(screen.getByLabelText('Abrir Cert X'));
    await user.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getByText('Editar Certificado')).toBeInTheDocument();
    expect(document.getElementById('cert-form-title')).toHaveValue('Cert X');
  });

  it('never renders a javascript: URI as the credential validation link (XSS guard)', async () => {
    const user = userEvent.setup();
    renderModule({ certificates: [makeCertificate({ title: 'Cert X', credentialUrl: 'javascript:alert(1)' })] });
    await user.click(screen.getByLabelText('Abrir Cert X'));
    expect(screen.queryByRole('link', { name: /Verificar/ })).not.toBeInTheDocument();
  });

  it('labels every stat card and uses them as shortcuts', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [
        makeCertificate({ id: 'c1', title: 'Curto', hours: 1, issueDate: '2026-03-01' }),
        makeCertificate({ id: 'c2', title: 'Longo', hours: 9, issueDate: '2026-01-01' }),
      ],
      earnedBadges: [{ id: 'b1', fileName: 'a.png', filePath: 'p', url: 'u', isFavorite: false, createdAt: '' }],
    });
    expect(screen.getByRole('button', { name: /^1\s*Badges$/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Horas de estudo/ }));
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles.indexOf('Longo')).toBeLessThan(titles.indexOf('Curto'));

    await user.type(screen.getByPlaceholderText(/Buscar por título/), 'Longo');
    await user.click(screen.getByRole('button', { name: /Certificados$/ }));
    expect(screen.getByText('Curto')).toBeInTheDocument();
  });

  it('opens the badges section from its stat card', async () => {
    sessionStorage.removeItem('gsa_badges_expanded');
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const user = userEvent.setup();
    renderModule({
      certificates: [makeCertificate()],
      earnedBadges: [{ id: 'b1', fileName: 'a.png', filePath: 'p', url: 'u', isFavorite: false, createdAt: '' }],
    });
    const toggle = screen.getByRole('button', { name: /^Badges/, expanded: false });
    await user.click(screen.getByRole('button', { name: /^1\s*Badges$/ }));
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(scrollIntoView).toHaveBeenCalled();
    sessionStorage.removeItem('gsa_badges_expanded');
  });

  it('pre-selects only the filtered certificates when exporting', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [
        makeCertificate({ id: 'c1', title: 'Cert A', category: 'Cloud' }),
        makeCertificate({ id: 'c2', title: 'Cert B', category: 'Liderança' }),
      ],
    });
    await user.click(screen.getByRole('button', { name: 'Liderança' }));
    await user.click(screen.getByLabelText('Exportar certificados'));
    await user.click(screen.getByRole('menuitem', { name: /Baixar PDF/ }));

    expect(screen.getByText('Pré-selecionados conforme os filtros atuais')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Cert B/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Cert A/ })).not.toBeChecked();
  });

  it('previews stored PDFs inline in the detail view', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [
        makeCertificate({ title: 'Cert X', fileType: 'pdf', fileData: 'https://signed.example/cert.pdf' }),
      ],
    });
    await user.click(screen.getByLabelText('Abrir Cert X'));
    expect(screen.getByTitle('PDF de Cert X')).toHaveAttribute('src', 'https://signed.example/cert.pdf');
    expect(screen.getByRole('link', { name: /Abrir em nova aba/ })).toHaveAttribute(
      'href',
      'https://signed.example/cert.pdf',
    );
  });

  it('keeps the download fallback for legacy inline PDFs', async () => {
    const user = userEvent.setup();
    renderModule({
      certificates: [
        makeCertificate({ title: 'Cert X', fileType: 'pdf', fileData: 'data:application/pdf;base64,AA==' }),
      ],
    });
    await user.click(screen.getByLabelText('Abrir Cert X'));
    expect(screen.queryByTitle('PDF de Cert X')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Baixar Documento PDF/ })).toBeInTheDocument();
  });

  it('links to LinkedIn with the certification pre-filled from the detail view', async () => {
    const user = userEvent.setup();
    renderModule({ certificates: [makeCertificate({ title: 'Cert X', issuer: 'Google' })] });
    await user.click(screen.getByLabelText('Abrir Cert X'));
    const link = screen.getByRole('link', { name: /LinkedIn/ });
    const url = new URL(link.getAttribute('href')!);
    expect(url.origin + url.pathname).toBe('https://www.linkedin.com/profile/add');
    expect(url.searchParams.get('name')).toBe('Cert X');
    expect(url.searchParams.get('organizationName')).toBe('Google');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('offers AI auto-fill only after a file is chosen', async () => {
    const user = userEvent.setup();
    renderModule();
    await user.click(screen.getByLabelText('Novo certificado'));
    expect(screen.getByText('PNG, JPG ou PDF até 4MB')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Preencher com IA/ })).not.toBeInTheDocument();

    const input = screen.getByRole('dialog').querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, new File(['x'], 'cert.png', { type: 'image/png' }));
    expect(await screen.findByRole('button', { name: /Preencher com IA/ })).toBeEnabled();
  });

  it('hides the category chips when there is only one category', () => {
    renderModule({
      certificates: [
        makeCertificate({ id: 'c1', category: 'Google Cloud' }),
        makeCertificate({ id: 'c2', category: 'Google Cloud' }),
      ],
    });
    expect(screen.queryByRole('button', { name: 'Todos' })).not.toBeInTheDocument();
  });

  it('hides a certificate from the public portfolio and marks it as hidden', async () => {
    const user = userEvent.setup();
    const cert = makeCertificate({ title: 'Cert X' });
    const { onToggleCertificatePortfolio } = renderModule({ certificates: [cert] });

    await user.click(screen.getByLabelText('Mais ações para Cert X'));
    await user.click(screen.getByRole('menuitem', { name: 'Ocultar do portfólio' }));

    await waitFor(() => expect(onToggleCertificatePortfolio).toHaveBeenCalledWith(cert, false));
    expect(await screen.findByText('Certificado oculto do portfólio público')).toBeInTheDocument();
  });

  it('shows hidden certificates with an "Oculto" badge and lets the user show them again', async () => {
    const user = userEvent.setup();
    const cert = makeCertificate({ title: 'Cert X', showInPortfolio: false });
    const { onToggleCertificatePortfolio } = renderModule({ certificates: [cert] });
    expect(screen.getByText('Oculto')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Abrir Cert X'));
    await user.click(screen.getByRole('button', { name: 'Mostrar no portfólio público' }));
    await waitFor(() => expect(onToggleCertificatePortfolio).toHaveBeenCalledWith(cert, true));
  });
});
