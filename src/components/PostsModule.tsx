import { FileText, Plus, Search, X } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';
import type { PostPlatform, SocialPost } from '../types';
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

interface PostsModuleProps {
  posts: SocialPost[];
  onSavePost: (post: SocialPost) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
  initialDraftTopic?: string;
}

export function PostsModule({ posts, onSavePost, onDeletePost, initialDraftTopic = '' }: PostsModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState('Todos');
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

  const query = searchQuery.toLowerCase();
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(query) ||
      p.content.toLowerCase().includes(query) ||
      p.hashtags.some((h) => h.toLowerCase().includes(query)) ||
      getPostLinks(p).some((l) => l.link.toLowerCase().includes(query));
    const matchesPlatform =
      selectedPlatformFilter === 'Todos' || getPostPlatforms(p).includes(selectedPlatformFilter as PostPlatform);
    return matchesSearch && matchesPlatform;
  });

  const handleCopy = (post: SocialPost) => {
    navigator.clipboard.writeText(getPostCopyText(post));
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (post: SocialPost, message = 'Deseja excluir este post?') => {
    if (confirm(message)) {
      await onDeletePost(post.id);
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pt-15">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#EA4335]" />
            <span>Posts Criados</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-create-post-gemini"
            onClick={() => openEditor(newManualPost())}
            aria-label="Novo post"
            title="Novo post"
            className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo post</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Buscar posts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-[#EA4335]/30 focus:border-[#EA4335] bg-gray-50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {['Todos', ...PLATFORMS].map((plt) => (
            <button
              key={plt}
              onClick={() => setSelectedPlatformFilter(plt)}
              aria-pressed={selectedPlatformFilter === plt}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedPlatformFilter === plt
                  ? 'bg-[#EA4335] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
            >
              {plt}
            </button>
          ))}
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum post encontrado</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isCopied={copiedId === post.id}
              onOpen={() => setSelectedPostId(post.id)}
              onEdit={() =>
                openEditor(
                  post.tone === MANUAL_TONE && !post.socialLinks?.length
                    ? { ...post, socialLinks: getPostLinks(post) }
                    : post,
                )
              }
              onDelete={() => handleDelete(post)}
              onCopy={() => handleCopy(post)}
            />
          ))}
        </div>
      )}

      {isEditorOpen && editingPost && (
        <PostEditorModal
          draft={editingPost}
          isNew={!posts.some((p) => p.id === editingPost.id)}
          onChange={setEditingPost}
          onClose={closeEditor}
          onSavePost={onSavePost}
        />
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPostId(null)}
          onDelete={async () => {
            if (await handleDelete(selectedPost, 'Deseja excluir esta publicação?')) setSelectedPostId(null);
          }}
        />
      )}
    </div>
  );
}
