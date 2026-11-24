import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../app/ToastProvider';
import { PostsModule } from './PostsModule';
import { normalizeHttpUrl } from './posts/postModel';
import { type SocialPost } from '../types';
import { makePost } from '../test/factories';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

let lastSearch = '';
function LocationSpy() {
  const { search } = useLocation();
  useEffect(() => {
    lastSearch = search;
  }, [search]);
  return null;
}
const currentParams = () => new URLSearchParams(lastSearch);

function renderModule(overrides: Partial<ComponentProps<typeof PostsModule>> = {}, route = '/posts') {
  const props: ComponentProps<typeof PostsModule> = {
    posts: [],
    onSavePost: vi.fn().mockResolvedValue(undefined),
    onDeletePost: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>
          {children}
          <LocationSpy />
        </ToastProvider>
      </MemoryRouter>
    );
  }
  return { props, ...render(<PostsModule {...props} />, { wrapper: Wrapper }) };
}

async function deleteViaMenu(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(screen.getByRole('button', { name: `Mais ações para ${title}` }));
  await user.click(screen.getByRole('menuitem', { name: 'Excluir' }));
}

async function openNewPost(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText('Novo post'));
  return screen.getByRole('dialog');
}

beforeEach(() => {
  localStorage.clear();
});

describe('PostsModule', () => {
  it('shows a first-run empty state that opens the editor', async () => {
    const user = userEvent.setup();
    renderModule();
    expect(screen.getByText('Nenhum post ainda')).toBeInTheDocument();
    expect(screen.queryByLabelText('Buscar posts')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Criar primeiro post' }));
    expect(screen.getByRole('dialog', { name: 'Novo Post' })).toBeInTheDocument();
  });

  it('filters posts by platform', async () => {
    const user = userEvent.setup();
    renderModule({
      posts: [
        makePost({ id: 'p1', title: 'Post do LinkedIn', platform: 'LinkedIn' }),
        makePost({ id: 'p2', title: 'Post do Insta', platform: 'Instagram' }),
      ],
    });
    await user.click(screen.getByRole('button', { name: /^Instagram/ }));
    expect(screen.getByText('Post do Insta')).toBeInTheDocument();
    expect(screen.queryByText('Post do LinkedIn')).not.toBeInTheDocument();
  });

  it('filters posts by search query across title and content', async () => {
    const user = userEvent.setup();
    renderModule({
      posts: [
        makePost({ id: 'p1', title: 'Certificação Cloud' }),
        makePost({ id: 'p2', title: 'Evento de comunidade' }),
      ],
    });
    await user.type(screen.getByLabelText('Buscar posts'), 'cloud');
    expect(screen.getByText('Certificação Cloud')).toBeInTheDocument();
    expect(screen.queryByText('Evento de comunidade')).not.toBeInTheDocument();
  });

  describe('editor', () => {
    it('defaults a new post to "Publicado" and explains what is still missing', async () => {
      const user = userEvent.setup();
      renderModule();
      const dialog = await openNewPost(user);

      expect(within(dialog).getByLabelText('Status da Publicação')).toHaveTextContent('Publicado');
      const salvar = within(dialog).getByRole('button', { name: 'Salvar' });
      expect(salvar).toBeDisabled();
      expect(within(dialog).getByText('Para salvar, preencha: título, pelo menos 1 link.')).toBeInTheDocument();

      await user.type(within(dialog).getByLabelText('Título *'), 'Conquista de certificação');
      expect(within(dialog).getByText('Para salvar, preencha: pelo menos 1 link.')).toBeInTheDocument();
      expect(salvar).toBeDisabled();
    });

    it('does not save a manual post without a title', async () => {
      const user = userEvent.setup();
      const { props } = renderModule();
      const dialog = await openNewPost(user);
      await user.type(within(dialog).getByPlaceholderText('https://...'), 'https://linkedin.com/post/1');
      await user.click(within(dialog).getByRole('button', { name: 'Adicionar' }));
      await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
      expect(props.onSavePost).not.toHaveBeenCalled();
    });

    it('creates a manual post from a title, a social link and a status', async () => {
      const user = userEvent.setup();
      const { props } = renderModule();
      const dialog = await openNewPost(user);
      await user.type(within(dialog).getByLabelText('Título *'), 'Conquista de certificação');
      await user.type(within(dialog).getByPlaceholderText('https://...'), 'https://linkedin.com/post/1');
      await user.click(within(dialog).getByRole('button', { name: 'Adicionar' }));
      await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

      await waitFor(() => expect(props.onSavePost).toHaveBeenCalledTimes(1));
      const saved = vi.mocked(props.onSavePost).mock.calls[0]![0] as SocialPost;
      expect(saved.title).toBe('Conquista de certificação');
      expect(saved.tone).toBe('Manual');
      expect(saved.platform).toBe('LinkedIn');
      expect(saved.status).toBe('Publicado');
      expect(saved.publishedUrl).toBe('https://linkedin.com/post/1');
      expect(await screen.findByText('Post criado')).toBeInTheDocument();
    });

    it('includes a typed link even when Adicionar was never clicked', async () => {
      const user = userEvent.setup();
      const { props } = renderModule();
      const dialog = await openNewPost(user);
      await user.type(within(dialog).getByLabelText('Título *'), 'Post rápido');
      await user.type(within(dialog).getByPlaceholderText('https://...'), 'linkedin.com/posts/abc');

      const salvar = within(dialog).getByRole('button', { name: 'Salvar' });
      expect(salvar).toBeEnabled();
      await user.click(salvar);

      await waitFor(() => expect(props.onSavePost).toHaveBeenCalledTimes(1));
      const saved = vi.mocked(props.onSavePost).mock.calls[0]![0] as SocialPost;
      expect(saved.socialLinks?.map((l) => l.link)).toEqual(['https://linkedin.com/posts/abc']);
    });

    it('adds a link with Enter and rejects invalid ones with a visible error', async () => {
      const user = userEvent.setup();
      renderModule();
      const dialog = await openNewPost(user);
      const linkInput = within(dialog).getByPlaceholderText('https://...');

      await user.type(linkInput, 'javascript:alert(1){Enter}');
      expect(within(dialog).getByRole('alert')).toHaveTextContent('Link inválido');
      expect(linkInput).toHaveAttribute('aria-invalid', 'true');
      expect(within(dialog).queryByLabelText('Remover link')).not.toBeInTheDocument();

      await user.clear(linkInput);
      await user.type(linkInput, 'https://instagram.com/p/1{Enter}');
      expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
      expect(within(dialog).getByText('https://instagram.com/p/1')).toBeInTheDocument();
      expect(linkInput).toHaveValue('');
    });

    it('keeps the editor open and shows an error toast when saving fails', async () => {
      const user = userEvent.setup();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const onSavePost = vi.fn().mockRejectedValue(new Error('network'));
      renderModule({ onSavePost });
      const dialog = await openNewPost(user);
      await user.type(within(dialog).getByLabelText('Título *'), 'Post');
      await user.type(within(dialog).getByPlaceholderText('https://...'), 'https://linkedin.com/p/1');
      await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

      expect(await screen.findByText('Não foi possível salvar o post. Tente novamente.')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Salvar' })).toBeEnabled();
    });

    it('asks before discarding unsaved changes, and closes freely when nothing changed', async () => {
      const user = userEvent.setup();
      renderModule();

      let dialog = await openNewPost(user);
      await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      dialog = await openNewPost(user);
      await user.type(within(dialog).getByLabelText('Título *'), 'Rascunho importante');
      await user.click(within(dialog).getByLabelText('Fechar'));
      expect(within(dialog).getByText('Descartar as alterações não salvas?')).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: 'Continuar editando' }));
      expect(within(dialog).getByLabelText('Título *')).toHaveValue('Rascunho importante');

      await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
      await user.click(within(dialog).getByRole('button', { name: 'Descartar' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('deleting', () => {
    it('hides the post right away and lets the user undo', async () => {
      const user = userEvent.setup();
      const { props } = renderModule({ posts: [makePost({ title: 'Post a excluir' })] });

      await deleteViaMenu(user, 'Post a excluir');
      expect(screen.queryByText('Post a excluir')).not.toBeInTheDocument();
      await user.click(await screen.findByRole('button', { name: 'Desfazer' }));

      expect(screen.getByText('Post a excluir')).toBeInTheDocument();
      expect(props.onDeletePost).not.toHaveBeenCalled();
    });

    it('commits the delete once the undo toast times out', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const { props } = renderModule({ posts: [makePost({ id: 'p1', title: 'Post p1' })] });
        await deleteViaMenu(user, 'Post p1');
        await act(async () => {
          vi.advanceTimersByTime(6000);
        });
        expect(props.onDeletePost).toHaveBeenCalledWith('p1');
      } finally {
        vi.useRealTimers();
      }
    });

    it('deletes from the detail modal without a browser confirm()', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm');
      renderModule({ posts: [makePost({ title: 'Detalhe' })] });

      await user.click(screen.getByRole('button', { name: 'Detalhe' }));
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Excluir/ }));

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Detalhe')).not.toBeInTheDocument();
      expect(await screen.findByText('Post excluído')).toBeInTheDocument();
      confirmSpy.mockRestore();
    });
  });

  it('copies the post content to the clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderModule({ posts: [makePost({ content: 'Conteúdo do post' })] });

    await user.click(screen.getByRole('button', { name: /Copiar/ }));
    expect(writeText).toHaveBeenCalledWith('Conteúdo do post');
    expect(await screen.findByText('Copiado!')).toBeInTheDocument();
  });

  it('shows an error toast when the clipboard is unavailable', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderModule({ posts: [makePost()] });

    await user.click(screen.getByRole('button', { name: /Copiar/ }));
    expect(await screen.findByText('Não foi possível copiar o post.')).toBeInTheDocument();
    expect(screen.queryByText('Copiado!')).not.toBeInTheDocument();
  });

  it('never renders a javascript: URI as a published link (XSS guard)', () => {
    renderModule({
      posts: [
        makePost({
          tone: 'Manual',
          socialLinks: [{ id: 'l1', platform: 'LinkedIn', link: 'javascript:alert(1)' }],
        }),
      ],
    });
    expect(screen.queryByRole('link', { name: /Ver publicação/ })).not.toBeInTheDocument();
  });
});

describe('PostsModule — browsing', () => {
  const posts = [
    makePost({
      id: 'a',
      title: 'Post antigo',
      platform: 'LinkedIn',
      status: 'Publicado',
      score: 50,
      createdAt: '2026-09-10T12:00:00.000Z',
    }),
    makePost({
      id: 'b',
      title: 'Post do meio',
      platform: 'Instagram',
      status: 'Rascunho',
      score: 5,
      createdAt: '2026-10-05T12:00:00.000Z',
    }),
    makePost({
      id: 'c',
      title: 'Post novo',
      platform: 'Whatsapp',
      status: 'Publicado',
      score: 20,
      createdAt: '2026-10-20T12:00:00.000Z',
    }),
  ];
  const cardTitles = () =>
    screen.getAllByRole('article').map((card) => within(card).getAllByRole('button')[0]!.textContent);

  it('shows per-filter counts on the chips', () => {
    renderModule({ posts });
    expect(screen.getByRole('button', { name: /^Instagram/ })).toHaveTextContent('Instagram1');
    expect(screen.getByRole('button', { name: /^Publicado/ })).toHaveTextContent('Publicado2');
  });

  it('filters by status and keeps the filter in the URL', async () => {
    const user = userEvent.setup();
    renderModule({ posts });
    await user.click(screen.getByRole('button', { name: /^Rascunho/ }));
    expect(cardTitles()).toEqual(['Post do meio']);
    expect(currentParams().get('status')).toBe('Rascunho');
  });

  it('restores filters from the URL', () => {
    renderModule({ posts }, '/posts?plataforma=Whatsapp&q=novo');
    expect(cardTitles()).toEqual(['Post novo']);
    expect(screen.getByLabelText('Buscar posts')).toHaveValue('novo');
  });

  it('groups posts by month, newest first by default', () => {
    renderModule({ posts });
    const sections = screen.getAllByRole('region');
    expect(sections.map((s) => s.getAttribute('aria-label'))).toEqual(['Outubro de 2026', 'Setembro de 2026']);
    expect(cardTitles()).toEqual(['Post novo', 'Post do meio', 'Post antigo']);
  });

  it('sorts by score without month headers', async () => {
    const user = userEvent.setup();
    renderModule({ posts });
    await user.click(screen.getByLabelText('Ordenar posts'));
    await user.click(screen.getByRole('option', { name: 'Maior pontuação' }));
    expect(cardTitles()).toEqual(['Post antigo', 'Post novo', 'Post do meio']);
    expect(screen.queryByRole('heading', { name: /2026/ })).not.toBeInTheDocument();
    expect(currentParams().get('ordem')).toBe('pontuacao');
  });

  it('offers to clear filters when nothing matches', async () => {
    const user = userEvent.setup();
    renderModule({ posts }, '/posts?q=inexistente');
    expect(screen.getByText('Nenhum post encontrado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(currentParams().get('q')).toBeNull();
  });

  it('opens a post by clicking its title and edits it from the detail modal', async () => {
    const user = userEvent.setup();
    renderModule({ posts: [makePost({ title: 'Meu post', status: 'Agendado', score: 12, category: 'Evento' })] });
    await user.click(screen.getByRole('button', { name: 'Meu post' }));

    const detail = screen.getByRole('dialog', { name: 'Meu post' });
    expect(within(detail).getByText('Agendado')).toBeInTheDocument();
    expect(within(detail).getByText('Evento')).toBeInTheDocument();
    expect(within(detail).getByTitle('Pontuação')).toHaveTextContent('12');

    await user.click(within(detail).getByRole('button', { name: 'Editar' }));
    expect(screen.getByRole('dialog', { name: 'Editar Post' })).toBeInTheDocument();
    expect(screen.getByLabelText('Título *')).toHaveValue('Meu post');
  });

  it('labels the copy action by what gets copied for link-only posts', () => {
    renderModule({
      posts: [
        makePost({
          id: 'one',
          title: 'Um link',
          tone: 'Manual',
          socialLinks: [{ id: 'l1', platform: 'LinkedIn', link: 'https://linkedin.com/p/1' }],
        }),
        makePost({
          id: 'two',
          title: 'Dois links',
          tone: 'Manual',
          socialLinks: [
            { id: 'l1', platform: 'LinkedIn', link: 'https://linkedin.com/p/1' },
            { id: 'l2', platform: 'Instagram', link: 'https://instagram.com/p/2' },
          ],
        }),
      ],
    });
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar links' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Ver publicação no/ })).toHaveLength(3);
    expect(screen.getByText('instagram.com/p/2')).toBeInTheDocument();
  });

  it('edits likes, comments and hashtags', async () => {
    const user = userEvent.setup();
    const onSavePost = vi.fn().mockResolvedValue(undefined);
    renderModule({ posts: [makePost({ title: 'Engajado', hashtags: ['#google'] })], onSavePost });

    await user.click(screen.getByRole('button', { name: 'Mais ações para Engajado' }));
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar Post' });

    await user.clear(within(dialog).getByLabelText('Curtidas'));
    await user.type(within(dialog).getByLabelText('Curtidas'), '42');
    await user.type(within(dialog).getByLabelText('Hashtags'), 'cloud, #IA{Enter}');
    await user.click(within(dialog).getByRole('button', { name: 'Remover #google' }));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSavePost).toHaveBeenCalledTimes(1));
    const saved = onSavePost.mock.calls[0]![0] as SocialPost;
    expect(saved.likes).toBe(42);
    expect(saved.hashtags).toEqual(['#cloud', '#IA']);
  });
});

describe('normalizeHttpUrl', () => {
  it.each([
    ['https://linkedin.com/posts/1', 'https://linkedin.com/posts/1'],
    ['  linkedin.com/posts/1 ', 'https://linkedin.com/posts/1'],
    ['http://example.com', 'http://example.com/'],
  ])('accepts %s', (input, expected) => {
    expect(normalizeHttpUrl(input)).toBe(expected);
  });

  it.each(['', 'javascript:alert(1)', 'mailto:a@b.com', '/relative/path', 'not a url', 'localhost'])(
    'rejects %s',
    (input) => {
      expect(normalizeHttpUrl(input)).toBeNull();
    },
  );
});
