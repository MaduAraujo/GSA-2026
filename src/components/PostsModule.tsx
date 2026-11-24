import { ArrowUpDown, FileText, Plus, Search, X } from 'lucide-react';
import { EmptyState, NoResults } from './ui/EmptyState';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useToast } from '../app/ToastProvider';
import { usePersistedState } from '../hooks/usePersistedState';
import { useUndoableDelete } from '../hooks/useUndoableDelete';
import type { PostPlatform, PostStatus, SocialPost } from '../types';
import { PostCard } from './posts/PostCard';
import { PostDetailModal } from './posts/PostDetailModal';
import { PostEditorModal } from './posts/PostEditorModal';
import {
  getPostCopyText,
  getPostLinks,
  getPostPlatforms,
  MANUAL_TONE,
  newManualPost,
  PLATFORMS,
} from './posts/postModel';
import {
  groupPostsByMonth,
  isPostSortOption,
  POST_SORT_LABELS,
  POST_SORTERS,
  type PostSortOption,
  STATUSES,
} from './posts/postView';
import { SelectDropdown } from './SelectDropdown';

const ALL = 'Todos';

interface PostsModuleProps {
  posts: SocialPost[];
  onSavePost: (post: SocialPost) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
  initialDraftTopic?: string;
}

function usePostFilters() {
  const [params, setParams] = useSearchParams();
  const update = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  const platform = params.get('plataforma');
  const status = params.get('status');
  const sort = params.get('ordem');
  return {
    searchQuery: params.get('q') ?? '',
    platform: PLATFORMS.includes(platform as PostPlatform) ? (platform as PostPlatform) : ALL,
    status: STATUSES.includes(status as PostStatus) ? (status as PostStatus) : ALL,
    sort: isPostSortOption(sort) ? sort : ('recentes' as PostSortOption),
    setSearchQuery: (q: string) => update('q', q || null),
    setPlatform: (p: string) => update('plataforma', p === ALL ? null : p),
    setStatus: (s: string) => update('status', s === ALL ? null : s),
    setSort: (s: PostSortOption) => update('ordem', s === 'recentes' ? null : s),
    clear: () =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          ['q', 'plataforma', 'status'].forEach((k) => next.delete(k));
          return next;
        },
        { replace: true },
      ),
  };
}

function matchesSearch(post: SocialPost, query: string): boolean {
  if (!query) return true;
  return (
    post.title.toLowerCase().includes(query) ||
    post.content.toLowerCase().includes(query) ||
    post.category.toLowerCase().includes(query) ||
    post.hashtags.some((h) => h.toLowerCase().includes(query)) ||
    getPostLinks(post).some((l) => l.link.toLowerCase().includes(query))
  );
}

function toEditableDraft(post: SocialPost): Partial<SocialPost> {
  return post.tone === MANUAL_TONE && !post.socialLinks?.length ? { ...post, socialLinks: getPostLinks(post) } : post;
}

function FilterChip({
  label,
  count,
  isActive,
  activeClassName = 'bg-primary text-white shadow-xs',
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  activeClassName?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
        isActive ? activeClassName : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
      }`}
    >
      {label}
      <span className={`tabular-nums text-2xs ${isActive ? 'opacity-80' : 'text-gray-400'}`}>{count}</span>
    </button>
  );
}

export function PostsModule({ posts: allPosts, onSavePost, onDeletePost, initialDraftTopic = '' }: PostsModuleProps) {
  const toast = useToast();
  const pendingDelete = useUndoableDelete<SocialPost>({
    commit: (post) => onDeletePost(post.id),
    message: 'Post excluído',
    errorMessage: 'Não foi possível excluir o post. Ele foi restaurado.',
  });
  const posts = allPosts.filter((p) => !pendingDelete.pendingIds.has(p.id));
  const filters = usePostFilters();
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = usePersistedState('gsa_post_generator_open', false);
  const [editingPost, setEditingPost] = usePersistedState<Partial<SocialPost> | null>('gsa_post_editing_draft', null);
  const [selectedPostId, setSelectedPostId] = usePersistedState<string | null>('gsa_post_selected_id', null);

  const selectedPost = selectedPostId ? (posts.find((p) => p.id === selectedPostId) ?? null) : null;

  const openEditor = (draft: Partial<SocialPost>) => {
    setEditingPost(draft);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingPost(null);
  };

  const onDraftTopic = useEffectEvent((topic: string) => openEditor(newManualPost(topic)));

  useEffect(() => {
    if (initialDraftTopic) onDraftTopic(initialDraftTopic);
  }, [initialDraftTopic]);

  const query = filters.searchQuery.trim().toLowerCase();
  const searched = posts.filter((p) => matchesSearch(p, query));
  const inPlatform = (p: SocialPost, plt: string) => plt === ALL || getPostPlatforms(p).includes(plt as PostPlatform);
  const inStatus = (p: SocialPost, st: string) => st === ALL || p.status === st;

  const platformCounts = (plt: string) =>
    searched.filter((p) => inStatus(p, filters.status) && inPlatform(p, plt)).length;
  const statusCounts = (st: string) =>
    searched.filter((p) => inPlatform(p, filters.platform) && inStatus(p, st)).length;

  const filteredPosts = searched
    .filter((p) => inPlatform(p, filters.platform) && inStatus(p, filters.status))
    .sort(POST_SORTERS[filters.sort]);
  const groups =
    filters.sort === 'pontuacao' ? [{ key: 'all', label: '', posts: filteredPosts }] : groupPostsByMonth(filteredPosts);
  const hasActiveFilters = !!query || filters.platform !== ALL || filters.status !== ALL;

  const handleCopy = async (post: SocialPost) => {
    try {
      await navigator.clipboard.writeText(getPostCopyText(post));
    } catch {
      toast.show({ message: 'Não foi possível copiar o post.', tone: 'error' });
      return;
    }
    setCopiedId(post.id);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedId(null), 2000);
  };

  const renderCard = (post: SocialPost) => (
    <PostCard
      key={post.id}
      post={post}
      isCopied={copiedId === post.id}
      onOpen={() => setSelectedPostId(post.id)}
      onEdit={() => openEditor(toEditableDraft(post))}
      onDelete={() => pendingDelete.remove(post)}
      onCopy={() => void handleCopy(post)}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader icon={FileText} iconClassName="text-primary" title="Posts Criados">
        <Button
          id="btn-create-post-gemini"
          onClick={() => openEditor(newManualPost())}
          aria-label="Novo post"
          title="Novo post"
          variant="primary"
          collapseLabel
          icon={<Plus className="w-4 h-4" />}
        >
          Novo post
        </Button>
      </PageHeader>

      {posts.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Buscar posts"
              placeholder="Buscar por título, conteúdo, hashtag ou link"
              value={filters.searchQuery}
              onChange={(e) => filters.setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl text-sm border border-gray-200 focus-visible:ring-2 focus-visible:ring-danger/30 focus:border-danger bg-gray-50"
            />
            {filters.searchQuery && (
              <button
                onClick={() => filters.setSearchQuery('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filtrar por plataforma"
            className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none"
          >
            <FilterChip
              label={ALL}
              count={platformCounts(ALL)}
              isActive={filters.platform === ALL}
              onClick={() => filters.setPlatform(ALL)}
            />
            {PLATFORMS.map((plt) => (
              <FilterChip
                key={plt}
                label={plt}
                count={platformCounts(plt)}
                isActive={filters.platform === plt}
                onClick={() => filters.setPlatform(plt)}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-gray-100">
            <div
              role="group"
              aria-label="Filtrar por status"
              className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none"
            >
              <FilterChip
                label="Todos os status"
                count={statusCounts(ALL)}
                isActive={filters.status === ALL}
                onClick={() => filters.setStatus(ALL)}
              />
              {STATUSES.map((st) => (
                <FilterChip
                  key={st}
                  label={st}
                  count={statusCounts(st)}
                  isActive={filters.status === st}
                  onClick={() => filters.setStatus(st)}
                />
              ))}
            </div>

            <div className="relative w-44 shrink-0 sm:pt-2">
              <SelectDropdown
                value={filters.sort}
                onChange={(v) => filters.setSort(v as PostSortOption)}
                options={(Object.keys(POST_SORT_LABELS) as PostSortOption[]).map((opt) => ({
                  value: opt,
                  label: <span className="whitespace-nowrap">{POST_SORT_LABELS[opt]}</span>,
                }))}
                ariaLabel="Ordenar posts"
                buttonClassName="w-full h-8.5 pl-7 pr-7 rounded-xl text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
              />
              <ArrowUpDown
                aria-hidden="true"
                className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 sm:top-[calc(50%+0.25rem)] -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          iconClassName="bg-primary/10 text-primary"
          title="Nenhum post ainda"
          description="Registre aqui os posts que você publicou para acompanhar sua pontuação e engajamento."
          action={{
            label: 'Criar primeiro post',
            onClick: () => openEditor(newManualPost()),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : filteredPosts.length === 0 ? (
        <NoResults
          title="Nenhum post encontrado"
          description="Nenhum post corresponde à busca e aos filtros atuais."
          onClear={hasActiveFilters ? filters.clear : undefined}
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.label || 'Posts'} className="space-y-3">
              {group.label && (
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  {group.label}
                  <span className="text-xs font-medium text-gray-400">
                    {group.posts.length} {group.posts.length === 1 ? 'post' : 'posts'}
                  </span>
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{group.posts.map(renderCard)}</div>
            </section>
          ))}
        </div>
      )}

      {isEditorOpen && editingPost && (
        <PostEditorModal
          draft={editingPost}
          isNew={!allPosts.some((p) => p.id === editingPost.id)}
          onChange={setEditingPost}
          onClose={closeEditor}
          onSavePost={onSavePost}
        />
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPostId(null)}
          onEdit={() => {
            setSelectedPostId(null);
            openEditor(toEditableDraft(selectedPost));
          }}
          onDelete={() => {
            setSelectedPostId(null);
            pendingDelete.remove(selectedPost);
          }}
        />
      )}
    </div>
  );
}
