import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { GalleryModule } from './GalleryModule';
import { type GalleryPhoto } from '../types';
import { renderModule } from '../test/render';

const RealURL = globalThis.URL;

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'URL',
    class extends RealURL {
      static override createObjectURL = vi.fn(() => 'blob:mock-preview-url');
      static override revokeObjectURL = vi.fn();
    },
  );
});

function makePhoto(overrides: Partial<GalleryPhoto> = {}): GalleryPhoto {
  return {
    id: 'photo-1',
    imageData: 'https://signed.example.com/photo-1',
    caption: 'Workshop de GenAI',
    category: 'Eventos',
    createdAt: '2026-01-10T00:00:00.000Z',
    ...overrides,
  };
}

function renderGallery({
  photos = [],
  onSavePhoto = vi.fn().mockResolvedValue(undefined),
  onDeletePhoto = vi.fn().mockResolvedValue(undefined),
}: { photos?: GalleryPhoto[]; onSavePhoto?: Mock; onDeletePhoto?: Mock } = {}) {
  renderModule(<GalleryModule photos={photos} onSavePhoto={onSavePhoto} onDeletePhoto={onDeletePhoto} />, {});
  return { onSavePhoto, onDeletePhoto };
}

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;

describe('GalleryModule', () => {
  it('invites the user to add the first photos when the gallery is empty', async () => {
    const user = userEvent.setup();
    renderGallery();
    expect(screen.getByText('Sua galeria está vazia')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Adicionar primeiras fotos' }));
    expect(screen.getByRole('dialog', { name: 'Adicionar à galeria' })).toBeInTheDocument();
  });

  it('filters photos by search query across caption and category', async () => {
    const user = userEvent.setup();
    renderGallery({
      photos: [
        makePhoto({ id: 'p1', caption: 'Palestra Gemini' }),
        makePhoto({ id: 'p2', caption: 'Encontro local', category: 'Comunidade' }),
      ],
    });
    await user.type(screen.getByLabelText('Buscar na galeria'), 'gemini');
    expect(screen.getByAltText('Palestra Gemini')).toBeInTheDocument();
    expect(screen.queryByAltText('Encontro local')).not.toBeInTheDocument();
    expect(screen.getByText('1 de 2 itens')).toBeInTheDocument();
  });

  it('filters by category chip and shows how many items each category has', async () => {
    const user = userEvent.setup();
    renderGallery({
      photos: [
        makePhoto({ id: 'p1', category: 'Eventos', caption: 'Foto A' }),
        makePhoto({ id: 'p2', category: 'Comunidade', caption: 'Foto B' }),
        makePhoto({ id: 'p3', category: 'Comunidade', caption: 'Foto C' }),
      ],
    });
    const chip = screen.getByRole('button', { name: 'Comunidade 2' });
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByAltText('Foto B')).toBeInTheDocument();
    expect(screen.queryByAltText('Foto A')).not.toBeInTheDocument();
  });

  it('filters by media type when there are both photos and videos', async () => {
    const user = userEvent.setup();
    renderGallery({
      photos: [
        makePhoto({ id: 'p1', caption: 'Foto A' }),
        makePhoto({ id: 'v1', caption: 'Clipe', mediaType: 'video' }),
      ],
    });
    await user.click(screen.getByRole('button', { name: 'Vídeos' }));
    expect(screen.queryByAltText('Foto A')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir Clipe' })).toBeInTheDocument();
  });

  it('explains an empty search and clears every filter at once', async () => {
    const user = userEvent.setup();
    renderGallery({ photos: [makePhoto()] });
    await user.type(screen.getByLabelText('Buscar na galeria'), 'inexistente');
    expect(screen.getByText('Nenhuma foto encontrada')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByAltText('Workshop de GenAI')).toBeInTheDocument();
  });

  it('groups items by month, newest first by default', () => {
    renderGallery({
      photos: [
        makePhoto({ id: 'old', caption: 'Antiga', takenAt: '2026-03-02' }),
        makePhoto({ id: 'new', caption: 'Nova', takenAt: '2026-10-20' }),
      ],
    });
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Outubro de 2026', 'Março de 2026']);
  });

  it('rejects an unsupported file with an error message', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Adicionar fotos ou vídeos'));

    const file = new File(['hello'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput(), { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('“doc.pdf” não é uma imagem');
  });

  it('rejects a source image larger than 25MB', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Adicionar fotos ou vídeos'));

    const bigFile = new File(['x'], 'big.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 26 * 1024 * 1024 });
    fireEvent.change(fileInput(), { target: { files: [bigFile] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Imagem muito grande');
  });

  it('rejects a video file larger than 50MB', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Adicionar fotos ou vídeos'));

    const oversizedVideo = new File(['x'], 'huge.mp4', { type: 'video/mp4' });
    Object.defineProperty(oversizedVideo, 'size', { value: 50 * 1024 * 1024 + 1 });
    fireEvent.change(fileInput(), { target: { files: [oversizedVideo] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Vídeo muito grande');
  });

  it('uploads a photo with a trimmed caption and its detected date', async () => {
    const user = userEvent.setup();
    const { onSavePhoto } = renderGallery();
    await user.click(screen.getByLabelText('Adicionar fotos ou vídeos'));

    const file = new File(['fake-image-bytes'], 'photo.png', {
      type: 'image/png',
      lastModified: new Date(2026, 9, 5, 12).getTime(),
    });
    await user.upload(fileInput(), file);

    await user.type(await screen.findByLabelText('Legenda de photo.png'), '  Foto do evento  ');
    await user.type(screen.getByLabelText('Categoria'), ' Workshop ');
    const saveButton = screen.getByRole('button', { name: 'Salvar' });
    await waitFor(() => expect(saveButton).toBeEnabled());
    await user.click(saveButton);

    await waitFor(() => expect(onSavePhoto).toHaveBeenCalledTimes(1));
    const saved = onSavePhoto.mock.calls[0]![0] as GalleryPhoto;
    expect(saved.caption).toBe('Foto do evento');
    expect(saved.category).toBe('Workshop');
    expect(saved.takenAt).toBe('2026-10-05');
    expect(saved.imageData).toMatch(/^data:/);
    expect(await screen.findByText('1 item adicionado à galeria.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uploads several files at once with shared category', async () => {
    const user = userEvent.setup();
    const { onSavePhoto } = renderGallery();
    await user.click(screen.getByLabelText('Adicionar fotos ou vídeos'));

    await user.upload(fileInput(), [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
      new File(['c'], 'clip.mp4', { type: 'video/mp4' }),
    ]);
    await user.type(screen.getByLabelText('Categoria'), 'Meetup');
    const saveButton = await screen.findByRole('button', { name: 'Salvar 3 itens' });
    await waitFor(() => expect(saveButton).toBeEnabled());
    await user.click(saveButton);

    await waitFor(() => expect(onSavePhoto).toHaveBeenCalledTimes(3));
    const calls = onSavePhoto.mock.calls as [GalleryPhoto, File | undefined][];
    expect(calls.every(([photo]) => photo.category === 'Meetup')).toBe(true);
    expect(calls[2]![0].mediaType).toBe('video');
    expect(calls[2]![1]?.name).toBe('clip.mp4');
    expect(await screen.findByText('3 itens adicionados à galeria.')).toBeInTheDocument();
  });

  it('keeps failed items in the queue so they can be retried', async () => {
    const user = userEvent.setup();
    const onSavePhoto = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('network'));
    renderGallery({ onSavePhoto });
    await user.click(screen.getByLabelText('Adicionar fotos ou vídeos'));
    await user.upload(fileInput(), [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
    ]);
    const saveButton = await screen.findByRole('button', { name: 'Salvar 2 itens' });
    await waitFor(() => expect(saveButton).toBeEnabled());
    await user.click(saveButton);

    expect(await screen.findByText('1 de 2 não puderam ser salvos.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Adicionar à galeria' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });

  it('removes a file from the queue before saving', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Adicionar fotos ou vídeos'));
    await user.upload(fileInput(), [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
    ]);
    await user.click(await screen.findByRole('button', { name: 'Remover a.png' }));
    const list = screen.getByRole('list', { name: 'Arquivos selecionados' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  });

  it('closes the upload dialog with Cancelar', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Adicionar fotos ou vídeos'));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the viewer and navigates between items with buttons and arrow keys', async () => {
    const user = userEvent.setup();
    renderGallery({
      photos: [
        makePhoto({ id: 'p1', caption: 'Primeira', takenAt: '2026-10-03' }),
        makePhoto({ id: 'p2', caption: 'Segunda', takenAt: '2026-10-02' }),
      ],
    });
    await user.click(screen.getByRole('button', { name: 'Abrir Primeira' }));
    const viewer = screen.getByRole('dialog', { name: 'Primeira' });
    expect(within(viewer).getByText('1 de 2')).toBeInTheDocument();

    await user.click(within(viewer).getByRole('button', { name: 'Próxima' }));
    expect(screen.getByRole('dialog', { name: 'Segunda' })).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('dialog', { name: 'Primeira' })).toBeInTheDocument();
  });

  it('shows the full caption in the viewer', async () => {
    const user = userEvent.setup();
    const longCaption = 'Uma legenda bem longa que antes era cortada no visualizador da galeria do programa';
    renderGallery({ photos: [makePhoto({ caption: longCaption })] });
    await user.click(screen.getByRole('button', { name: `Abrir ${longCaption}` }));
    expect(within(screen.getByRole('dialog')).getByText(longCaption, { selector: 'p' })).toBeInTheDocument();
  });

  it('deletes with an undo toast instead of a confirm dialog', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');
    const { onDeletePhoto } = renderGallery({ photos: [makePhoto()] });

    await user.click(screen.getByRole('button', { name: 'Abrir Workshop de GenAI' }));
    await user.click(screen.getByRole('button', { name: 'Excluir foto' }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Sua galeria está vazia')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(screen.getByAltText('Workshop de GenAI')).toBeInTheDocument();
    expect(onDeletePhoto).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('commits the delete once the toast closes without undo', async () => {
    const user = userEvent.setup();
    const { onDeletePhoto } = renderGallery({ photos: [makePhoto()] });
    await user.click(screen.getByRole('button', { name: 'Mais ações para Workshop de GenAI' }));
    await user.click(screen.getByRole('menuitem', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Fechar notificação' }));
    await waitFor(() => expect(onDeletePhoto).toHaveBeenCalledWith('photo-1'));
  });

  it('edits caption and category of an existing item without re-uploading it', async () => {
    const user = userEvent.setup();
    const photo = makePhoto();
    const { onSavePhoto } = renderGallery({ photos: [photo] });

    await user.click(screen.getByRole('button', { name: 'Abrir Workshop de GenAI' }));
    await user.click(screen.getByRole('button', { name: 'Editar' }));

    const dialog = screen.getByRole('dialog', { name: 'Editar foto' });
    const caption = within(dialog).getByLabelText('Legenda');
    await user.clear(caption);
    await user.type(caption, 'Workshop atualizado');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSavePhoto).toHaveBeenCalledTimes(1));
    const [saved, videoFile] = onSavePhoto.mock.calls[0]!;
    expect(saved).toMatchObject({ id: 'photo-1', caption: 'Workshop atualizado', imageData: photo.imageData });
    expect(videoFile).toBeUndefined();
    expect(await screen.findByText('Alterações salvas.')).toBeInTheDocument();
  });

  it('keeps Salvar disabled in the edit dialog until something changes', async () => {
    const user = userEvent.setup();
    renderGallery({ photos: [makePhoto()] });
    await user.click(screen.getByRole('button', { name: 'Mais ações para Workshop de GenAI' }));
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it('shows a fallback when an image fails to load', () => {
    renderGallery({ photos: [makePhoto()] });
    fireEvent.error(screen.getByAltText('Workshop de GenAI'));
    expect(screen.getByText('Não foi possível carregar')).toBeInTheDocument();
  });
});
