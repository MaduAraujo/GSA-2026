import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GeminiPostsModule } from './GeminiPostsModule';
import { GeminiPost } from '../types';
import { makePost } from '../test/factories';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('GeminiPostsModule', () => {
  it('shows an empty state when there are no posts', () => {
    render(<GeminiPostsModule posts={[]} onSavePost={vi.fn()} onDeletePost={vi.fn()} />);
    expect(screen.getByText('Nenhum post encontrado')).toBeInTheDocument();
  });

  it('filters posts by platform', async () => {
    const user = userEvent.setup();
    render(
      <GeminiPostsModule
        posts={[makePost({ id: 'p1', title: 'Post do LinkedIn', platform: 'LinkedIn' }), makePost({ id: 'p2', title: 'Post do Insta', platform: 'Instagram' })]}
        onSavePost={vi.fn()}
        onDeletePost={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Instagram' }));
    expect(screen.getByText('Post do Insta')).toBeInTheDocument();
    expect(screen.queryByText('Post do LinkedIn')).not.toBeInTheDocument();
  });

  it('filters posts by search query across title and content', async () => {
    const user = userEvent.setup();
    render(
      <GeminiPostsModule
        posts={[makePost({ id: 'p1', title: 'Certificação Cloud' }), makePost({ id: 'p2', title: 'Evento de comunidade' })]}
        onSavePost={vi.fn()}
        onDeletePost={vi.fn()}
      />
    );
    const [searchInput] = screen.getAllByRole('textbox');
    await user.type(searchInput, 'cloud');
    expect(screen.getByText('Certificação Cloud')).toBeInTheDocument();
    expect(screen.queryByText('Evento de comunidade')).not.toBeInTheDocument();
  });

  it('does not save a manual post without a title', async () => {
    const user = userEvent.setup();
    const onSavePost = vi.fn();
    render(<GeminiPostsModule posts={[]} onSavePost={onSavePost} onDeletePost={vi.fn()} />);
    await user.click(screen.getByLabelText('Novo post'));

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByPlaceholderText('https://...'), 'https://linkedin.com/post/1');
    await user.click(within(dialog).getByRole('button', { name: 'Adicionar' }));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(onSavePost).not.toHaveBeenCalled();
  });

  it('creates a manual post from a title and a social link', async () => {
    const user = userEvent.setup();
    const onSavePost = vi.fn().mockResolvedValue(undefined);
    render(<GeminiPostsModule posts={[]} onSavePost={onSavePost} onDeletePost={vi.fn()} />);
    await user.click(screen.getByLabelText('Novo post'));

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getAllByRole('textbox')[0], 'Conquista de certificação');
    await user.type(within(dialog).getByPlaceholderText('https://...'), 'https://linkedin.com/post/1');
    await user.click(within(dialog).getByRole('button', { name: 'Adicionar' }));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSavePost).toHaveBeenCalledTimes(1));
    const saved = onSavePost.mock.calls[0][0] as GeminiPost;
    expect(saved.title).toBe('Conquista de certificação');
    expect(saved.tone).toBe('Manual');
    expect(saved.platform).toBe('LinkedIn');
    expect(saved.publishedUrl).toBe('https://linkedin.com/post/1');
  });

  it('asks for confirmation before deleting and aborts when declined', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDeletePost = vi.fn();
    render(<GeminiPostsModule posts={[makePost()]} onSavePost={vi.fn()} onDeletePost={onDeletePost} />);

    await user.click(screen.getByLabelText('Excluir Post'));
    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeletePost).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('copies the post content to the clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<GeminiPostsModule posts={[makePost({ content: 'Conteúdo do post' })]} onSavePost={vi.fn()} onDeletePost={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Copiar/ }));
    expect(writeText).toHaveBeenCalledWith('Conteúdo do post');
    expect(await screen.findByText('Copiado!')).toBeInTheDocument();
  });

  it('never renders a javascript: URI as a published link (XSS guard)', () => {
    render(
      <GeminiPostsModule
        posts={[
          makePost({
            tone: 'Manual',
            socialLinks: [{ id: 'l1', platform: 'LinkedIn', link: 'javascript:alert(1)' }],
          }),
        ]}
        onSavePost={vi.fn()}
        onDeletePost={vi.fn()}
      />
    );
    expect(screen.queryByRole('link', { name: /Ver publicação/ })).not.toBeInTheDocument();
  });
});
