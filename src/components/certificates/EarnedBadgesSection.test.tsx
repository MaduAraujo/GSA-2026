import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../app/ToastProvider';
import type { EarnedBadge } from '../../types';
import { badgeDisplayName } from './badgeFiles';
import { EarnedBadgesSection } from './EarnedBadgesSection';

const badge = (overrides: Partial<EarnedBadge> = {}): EarnedBadge => ({
  id: 'b1',
  fileName: 'gemini-nivel2.png',
  filePath: 'u1/earned-badges/2-1-gemini-nivel2.png',
  url: 'https://signed.example/b1',
  isFavorite: false,
  createdAt: '2026-10-30T12:00:00Z',
  ...overrides,
});

const renderSection = (props: Partial<React.ComponentProps<typeof EarnedBadgesSection>> = {}) => {
  const onUpload = props.onUpload ?? vi.fn().mockResolvedValue(undefined);
  const onDelete = props.onDelete ?? vi.fn().mockResolvedValue(undefined);
  const onToggleFavorite = props.onToggleFavorite ?? vi.fn().mockResolvedValue(undefined);
  sessionStorage.setItem('gsa_badges_expanded', 'true');
  render(
    <EarnedBadgesSection
      badges={[]}
      isLoading={false}
      {...props}
      onUpload={onUpload}
      onDelete={onDelete}
      onToggleFavorite={onToggleFavorite}
    />,
    { wrapper: ToastProvider },
  );
  return { onUpload, onDelete, onToggleFavorite };
};

describe('EarnedBadgesSection', () => {
  afterEach(() => vi.restoreAllMocks());

  it('starts collapsed and expands when the header is clicked', async () => {
    const user = userEvent.setup();
    sessionStorage.removeItem('gsa_badges_expanded');
    render(
      <EarnedBadgesSection
        badges={[badge()]}
        isLoading={false}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
      { wrapper: ToastProvider },
    );
    const toggle = screen.getByRole('button', { expanded: false });
    expect(screen.queryByAltText(badgeDisplayName('gemini-nivel2.png'))).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByAltText(badgeDisplayName('gemini-nivel2.png'))).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByAltText(badgeDisplayName('gemini-nivel2.png'))).not.toBeInTheDocument();
  });

  it('shows the heading and an empty state', () => {
    renderSection();
    expect(screen.getByRole('heading', { name: 'Badges' })).toBeInTheDocument();
    expect(screen.getByText(/Nenhum badge anexado ainda/)).toBeInTheDocument();
  });

  it('lists the badges, previewing images and linking each file', () => {
    renderSection({
      badges: [badge(), badge({ id: 'b2', fileName: 'certificado.pdf', url: 'https://signed.example/b2' })],
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'Gemini nivel2' })).toHaveAttribute('src', 'https://signed.example/b1');
    expect(screen.getByRole('button', { name: 'Visualizar badge Certificado' })).toBeInTheDocument();
  });

  it('turns file names into readable titles', () => {
    expect(badgeDisplayName('gemini-nivel_2.png')).toBe('Gemini nivel 2');
    expect(badgeDisplayName('.png')).toBe('.png');
  });

  it('rejects unsupported file types without uploading', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { onUpload } = renderSection();
    await user.upload(
      screen.getByLabelText('Arquivos dos badges'),
      new File(['x'], 'notas.txt', { type: 'text/plain' }),
    );
    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Envie uma imagem ou PDF');
  });

  it('uploads files dropped onto the card', async () => {
    const { onUpload } = renderSection();
    const file = new File(['a'], 'drop.png', { type: 'image/png' });
    fireEvent.drop(screen.getByRole('region', { name: 'Badges' }), {
      dataTransfer: { files: [file], types: ['Files'] },
    });
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file));
  });

  it('uploads every chosen file', async () => {
    const user = userEvent.setup();
    const { onUpload } = renderSection();
    const a = new File(['a'], 'a.png', { type: 'image/png' });
    const b = new File(['b'], 'b.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Arquivos dos badges'), [a, b]);
    expect(onUpload).toHaveBeenNthCalledWith(1, a);
    expect(onUpload).toHaveBeenNthCalledWith(2, b);
  });

  it('rejects files over 50MB without uploading', async () => {
    const user = userEvent.setup();
    const { onUpload } = renderSection();
    const big = new File(['x'], 'grande.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: 51 * 1024 * 1024 });
    await user.upload(screen.getByLabelText('Arquivos dos badges'), big);
    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('O limite é 50MB');
  });

  it('shows an error when the upload fails', async () => {
    const user = userEvent.setup();
    renderSection({ onUpload: vi.fn().mockRejectedValue(new Error('boom')) });
    await user.upload(screen.getByLabelText('Arquivos dos badges'), new File(['x'], 'r.png', { type: 'image/png' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível anexar o badge');
  });

  it('hides a removed badge at once and deletes it when the undo toast closes', async () => {
    const user = userEvent.setup();
    const target = badge();
    const { onDelete } = renderSection({ badges: [target] });
    await user.click(screen.getByRole('button', { name: 'Remover badge gemini-nivel2.png' }));

    expect(screen.queryByRole('img', { name: 'Gemini nivel2' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Badge removido');
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Fechar notificação' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(target));
  });

  it('brings the badge back when removal is undone', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderSection({ badges: [badge()] });
    await user.click(screen.getByRole('button', { name: 'Remover badge gemini-nivel2.png' }));
    await user.click(screen.getByRole('button', { name: 'Desfazer' }));

    expect(screen.getByRole('img', { name: 'Gemini nivel2' })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('restores the badge and reports the error when the delete fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderSection({ badges: [badge()], onDelete: vi.fn().mockRejectedValue(new Error('boom')) });
    await user.click(screen.getByRole('button', { name: 'Remover badge gemini-nivel2.png' }));
    await user.click(screen.getByRole('button', { name: 'Fechar notificação' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível remover o badge');
    expect(screen.getByRole('img', { name: 'Gemini nivel2' })).toBeInTheDocument();
  });

  it('opens the badge in an in-app viewer with zoom controls', async () => {
    const user = userEvent.setup();
    renderSection({ badges: [badge()] });
    await user.click(screen.getByRole('button', { name: 'Visualizar badge Gemini nivel2' }));

    const dialog = screen.getByRole('dialog', { name: 'Gemini nivel2' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diminuir zoom' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Aumentar zoom' }));
    expect(screen.getByText('150%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ajustar à tela' }));
    expect(screen.getByText('100%')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navigates between badges in the viewer', async () => {
    const user = userEvent.setup();
    renderSection({
      badges: [badge(), badge({ id: 'b2', fileName: 'cloud-badge.png', url: 'https://signed.example/b2' })],
    });
    await user.click(screen.getByRole('button', { name: 'Visualizar badge Gemini nivel2' }));
    expect(screen.queryByRole('button', { name: 'Badge anterior' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Próximo badge' }));
    expect(screen.getByRole('dialog', { name: 'Cloud badge' })).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('dialog', { name: 'Gemini nivel2' })).toBeInTheDocument();
  });

  it('embeds PDFs in the viewer', async () => {
    const user = userEvent.setup();
    renderSection({ badges: [badge({ fileName: 'credencial.pdf', url: 'https://signed.example/pdf' })] });
    await user.click(screen.getByRole('button', { name: 'Visualizar badge Credencial' }));
    expect(screen.getByTitle('Credencial')).toHaveAttribute('src', 'https://signed.example/pdf');
    expect(screen.queryByRole('button', { name: 'Aumentar zoom' })).not.toBeInTheDocument();
  });

  it('moves to the next badge after deleting from the viewer', async () => {
    const user = userEvent.setup();
    const badges = [badge(), badge({ id: 'b2', fileName: 'cloud-badge.png' })];
    const onDelete = vi.fn().mockResolvedValue(undefined);
    renderSection({ badges, onDelete });
    await user.click(screen.getByRole('button', { name: 'Visualizar badge Gemini nivel2' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Remover badge gemini-nivel2.png' }));
    expect(screen.getByRole('dialog', { name: 'Cloud badge' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fechar notificação' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(badges[0]));
  });

  it('marks a badge as favorite for the public portfolio', async () => {
    const user = userEvent.setup();
    const target = badge();
    const { onToggleFavorite } = renderSection({ badges: [target] });
    const star = screen.getByRole('button', { name: 'Destacar Gemini nivel2 no portfólio público' });
    expect(star).toHaveAttribute('aria-pressed', 'false');
    await user.click(star);
    expect(onToggleFavorite).toHaveBeenCalledWith(target, true);
  });

  it('shows how many badges are featured and lets the viewer unmark one', async () => {
    const user = userEvent.setup();
    const target = badge({ isFavorite: true });
    const { onToggleFavorite } = renderSection({ badges: [target, badge({ id: 'b2', fileName: 'outro.png' })] });
    await user.click(screen.getByRole('button', { name: 'Visualizar badge Gemini nivel2' }));
    const dialogStar = within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Destacar no portfólio público',
    });
    expect(dialogStar).toHaveAttribute('aria-pressed', 'true');
    await user.click(dialogStar);
    expect(onToggleFavorite).toHaveBeenCalledWith(target, false);
  });

  it('reverts the star and shows an error when saving the favorite fails', async () => {
    const user = userEvent.setup();
    renderSection({ badges: [badge()], onToggleFavorite: vi.fn().mockRejectedValue(new Error('boom')) });
    const star = screen.getByRole('button', { name: 'Destacar Gemini nivel2 no portfólio público' });
    await user.click(star);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível atualizar o destaque');
    expect(star).toHaveAttribute('aria-pressed', 'false');
  });

  const sizedFile = (name: string, mb: number) => {
    const file = new File(['x'], name, { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: mb * 1024 * 1024 });
    return file;
  };

  it('uploads small files without a progress bar', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn().mockResolvedValue(undefined);
    renderSection({ onUpload });
    await user.upload(screen.getByLabelText('Arquivos dos badges'), sizedFile('mini.png', 0.5));
    expect(onUpload).toHaveBeenCalledWith(expect.any(File));
    expect(onUpload.mock.calls[0]).toHaveLength(1);
  });

  it('shows a progress bar with a near-limit warning for large files', async () => {
    const user = userEvent.setup();
    let report!: (loaded: number, total: number) => void;
    let finish!: () => void;
    const onUpload = vi.fn((_file: File, opts?: { onProgress?: (l: number, t: number) => void }) => {
      report = opts!.onProgress!;
      return new Promise<void>((resolve) => (finish = resolve));
    });
    renderSection({ onUpload });
    await user.upload(screen.getByLabelText('Arquivos dos badges'), sizedFile('grande.png', 45));

    const bar = await screen.findByRole('progressbar', { name: 'Progresso do envio' });
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText(/perto do limite de 50MB/)).toBeInTheDocument();

    act(() => report(22.5 * 1024 * 1024, 45 * 1024 * 1024));
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('22.5 de 45.0 MB')).toBeInTheDocument();

    await act(async () => finish());
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('cancels an in-flight upload without showing an error', async () => {
    const user = userEvent.setup();
    let signal!: AbortSignal;
    const onUpload = vi.fn(
      (_file: File, opts?: { signal?: AbortSignal }) =>
        new Promise<void>((_resolve, reject) => {
          signal = opts!.signal!;
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    renderSection({ onUpload });
    await user.upload(screen.getByLabelText('Arquivos dos badges'), sizedFile('grande.png', 10));

    await user.click(await screen.findByRole('button', { name: 'Cancelar envio' }));
    expect(signal.aborted).toBe(true);
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a thumbnail strip while collapsed, favorites first, with a "+N" overflow', async () => {
    const user = userEvent.setup();
    sessionStorage.removeItem('gsa_badges_expanded');
    const badges = Array.from({ length: 7 }, (_, i) =>
      badge({ id: `b${i}`, fileName: `badge-${i}.png`, isFavorite: i === 6 }),
    );
    render(
      <EarnedBadgesSection
        badges={badges}
        isLoading={false}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
      { wrapper: ToastProvider },
    );
    const strip = screen.getByRole('list', { name: 'Prévia dos badges' });
    const thumbs = within(strip).getAllByRole('button', { name: /^Visualizar badge/ });
    expect(thumbs).toHaveLength(5);
    expect(thumbs[0]).toHaveAccessibleName('Visualizar badge Badge 6');

    await user.click(within(strip).getByRole('button', { name: 'Ver todos os 7 badges' }));
    expect(screen.queryByRole('list', { name: 'Prévia dos badges' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
  });

  it('opens the viewer straight from a collapsed thumbnail', async () => {
    const user = userEvent.setup();
    sessionStorage.removeItem('gsa_badges_expanded');
    render(
      <EarnedBadgesSection
        badges={[badge()]}
        isLoading={false}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
      { wrapper: ToastProvider },
    );
    await user.click(screen.getByRole('button', { name: 'Visualizar badge Gemini nivel2' }));
    expect(screen.getByRole('dialog', { name: 'Gemini nivel2' })).toBeInTheDocument();
  });
});
