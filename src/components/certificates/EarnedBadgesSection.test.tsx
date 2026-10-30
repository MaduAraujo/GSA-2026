import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EarnedBadge } from '../../types';
import { EarnedBadgesSection } from './EarnedBadgesSection';

const badge = (overrides: Partial<EarnedBadge> = {}): EarnedBadge => ({
  id: 'b1',
  fileName: 'gemini-nivel2.png',
  filePath: 'u1/earned-badges/2-1-gemini-nivel2.png',
  url: 'https://signed.example/b1',
  createdAt: '2026-10-30T12:00:00Z',
  ...overrides,
});

const renderSection = (props: Partial<React.ComponentProps<typeof EarnedBadgesSection>> = {}) => {
  const onUpload = props.onUpload ?? vi.fn().mockResolvedValue(undefined);
  const onDelete = props.onDelete ?? vi.fn().mockResolvedValue(undefined);
  render(<EarnedBadgesSection badges={[]} isLoading={false} {...props} onUpload={onUpload} onDelete={onDelete} />);
  return { onUpload, onDelete };
};

describe('EarnedBadgesSection', () => {
  afterEach(() => vi.restoreAllMocks());

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
    expect(screen.getByRole('img', { name: 'gemini-nivel2.png' })).toHaveAttribute('src', 'https://signed.example/b1');
    expect(screen.getByRole('link', { name: /certificado\.pdf/ })).toHaveAttribute('href', 'https://signed.example/b2');
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

  it('removes a badge after confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const target = badge();
    const { onDelete } = renderSection({ badges: [target] });
    await user.click(screen.getByRole('button', { name: 'Remover badge gemini-nivel2.png' }));
    expect(onDelete).toHaveBeenCalledWith(target);
  });

  it('keeps the badge when removal is cancelled', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { onDelete } = renderSection({ badges: [badge()] });
    await user.click(screen.getByRole('button', { name: 'Remover badge gemini-nivel2.png' }));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
