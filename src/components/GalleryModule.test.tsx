import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GalleryModule } from './GalleryModule';
import { GalleryPhoto } from '../types';

beforeEach(() => {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock-video-url'),
    revokeObjectURL: vi.fn(),
  });
});

function makePhoto(overrides: Partial<GalleryPhoto> = {}): GalleryPhoto {
  return {
    id: 'photo-1',
    imageData: 'data:image/png;base64,AAA',
    caption: 'Workshop de GenAI',
    category: 'Eventos',
    createdAt: '2026-01-10T00:00:00.000Z',
    ...overrides,
  };
}

describe('GalleryModule', () => {
  it('shows an empty state when there are no photos', () => {
    render(<GalleryModule photos={[]} onSavePhoto={vi.fn()} onDeletePhoto={vi.fn()} />);
    expect(screen.getByText('Nenhuma foto encontrada')).toBeInTheDocument();
  });

  it('filters photos by search query across caption and category', async () => {
    const user = userEvent.setup();
    render(
      <GalleryModule
        photos={[makePhoto({ id: 'p1', caption: 'Palestra Gemini' }), makePhoto({ id: 'p2', caption: 'Encontro local', category: 'Comunidade' })]}
        onSavePhoto={vi.fn()}
        onDeletePhoto={vi.fn()}
      />
    );
    await user.type(screen.getByPlaceholderText('Buscar por legenda ou categoria...'), 'gemini');
    expect(screen.getByAltText('Palestra Gemini')).toBeInTheDocument();
    expect(screen.queryByAltText('Encontro local')).not.toBeInTheDocument();
  });

  it('filters photos by category chip', async () => {
    const user = userEvent.setup();
    render(
      <GalleryModule
        photos={[makePhoto({ id: 'p1', category: 'Eventos', caption: 'Foto A' }), makePhoto({ id: 'p2', category: 'Comunidade', caption: 'Foto B' })]}
        onSavePhoto={vi.fn()}
        onDeletePhoto={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Comunidade' }));
    expect(screen.getByAltText('Foto B')).toBeInTheDocument();
    expect(screen.queryByAltText('Foto A')).not.toBeInTheDocument();
  });

  it('rejects a non-image file with an error message', async () => {
    const user = userEvent.setup();
    render(<GalleryModule photos={[]} onSavePhoto={vi.fn()} onDeletePhoto={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova foto'));

    const file = new File(['hello'], 'doc.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Envie um arquivo de imagem');
  });

  it('rejects a file larger than 4MB with an error message', async () => {
    const user = userEvent.setup();
    render(<GalleryModule photos={[]} onSavePhoto={vi.fn()} onDeletePhoto={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova foto'));

    const bigFile = new File([new Uint8Array(5 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, bigFile);

    expect(await screen.findByRole('alert')).toHaveTextContent('Imagem muito grande');
  });

  it('uploads a valid photo and saves it with trimmed caption and category', async () => {
    const user = userEvent.setup();
    const onSavePhoto = vi.fn().mockResolvedValue(undefined);
    render(<GalleryModule photos={[]} onSavePhoto={onSavePhoto} onDeletePhoto={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova foto'));

    const file = new File(['fake-image-bytes'], 'photo.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => expect(screen.getByAltText('Prévia')).toBeInTheDocument());

    const dialog = screen.getByRole('dialog');
    const captionInput = within(dialog).getAllByRole('textbox')[0];
    await user.type(captionInput, '  Foto do evento  ');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSavePhoto).toHaveBeenCalledTimes(1));
    const saved = onSavePhoto.mock.calls[0][0] as GalleryPhoto;
    expect(saved.caption).toBe('Foto do evento');
    expect(saved.imageData).toMatch(/^data:/);
  });

  it('accepts a video file, shows a video preview, and saves it via the videoFile argument', async () => {
    const user = userEvent.setup();
    const onSavePhoto = vi.fn().mockResolvedValue(undefined);
    render(<GalleryModule photos={[]} onSavePhoto={onSavePhoto} onDeletePhoto={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova foto'));

    const videoFile = new File(['fake-video-bytes'], 'clip.mp4', { type: 'video/mp4' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, videoFile);

    expect(await screen.findByText('Vídeo carregado com sucesso!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSavePhoto).toHaveBeenCalledTimes(1));
    const [savedPhoto, savedVideoFile] = onSavePhoto.mock.calls[0];
    expect((savedPhoto as GalleryPhoto).mediaType).toBe('video');
    expect(savedVideoFile).toBe(videoFile);
  });

  it('rejects a video file larger than 2GB with an error message', async () => {
    const user = userEvent.setup();
    render(<GalleryModule photos={[]} onSavePhoto={vi.fn()} onDeletePhoto={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova foto'));

    const oversizedVideo = new File(['x'], 'huge.mp4', { type: 'video/mp4' });
    Object.defineProperty(oversizedVideo, 'size', { value: 2 * 1024 * 1024 * 1024 + 1 });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [oversizedVideo] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Vídeo muito grande');
  });

  it('asks for confirmation before deleting a photo', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDeletePhoto = vi.fn();
    render(<GalleryModule photos={[makePhoto()]} onSavePhoto={vi.fn()} onDeletePhoto={onDeletePhoto} />);

    await user.click(screen.getByAltText('Workshop de GenAI'));
    await user.click(screen.getByLabelText('Excluir foto'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeletePhoto).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});