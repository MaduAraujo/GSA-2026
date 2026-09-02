import React, { useState, useEffect } from 'react';
import { 
  FileText,
  Copy,
  Check, 
  Plus, 
  Search, 
  Share2, 
  Trash2, 
  Edit3, 
  Calendar, 
  Heart, 
  MessageCircle, 
  ExternalLink, 
  X,
  Send,
  Wand2,
  CheckCircle2,
  Clock,
  Instagram,
  Linkedin,
  Twitter,
  Image as ImageIcon,
  ChevronDown,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GeminiPost, PostPlatform, PostStatus, ChallengeSocialLink } from '../types';
import { usePersistedState } from '../hooks/usePersistedState';
import { DatePicker } from './DatePicker';
import { isHttpUrl } from '../utils/safeUrl';

interface GeminiPostsModuleProps {
  posts: GeminiPost[];
  onSavePost: (post: GeminiPost) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
  initialDraftTopic?: string;
}

const PLATFORMS: PostPlatform[] = [
  'LinkedIn',
  'Instagram',
  'WhatsApp / Comunidade',
];

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function renderLinkedContent(content: string): React.ReactNode {
  return content.split(URL_PATTERN).map((part, idx) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={idx}
        href={part}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-[#1A73E8] font-bold hover:underline break-all"
      >
        <Share2 className="w-3 h-3 shrink-0" />
        {part}
      </a>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

function toLocalDateInputValue(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPostDisplayDate(post: GeminiPost): string {
  if (post.tone === 'Resultado de Desafio') {
    const [firstLine] = post.content.split('\n');
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(firstLine || '')) return firstLine;
  }
  return new Date(post.createdAt).toLocaleDateString('pt-BR');
}

function getPostPlatforms(post: GeminiPost): PostPlatform[] {
  if (post.socialLinks && post.socialLinks.length > 0) {
    return Array.from(new Set(post.socialLinks.map((l) => l.platform)));
  }
  return [post.platform];
}

function getPostLinks(post: GeminiPost): ChallengeSocialLink[] {
  if (post.socialLinks && post.socialLinks.length > 0) return post.socialLinks;
  if (post.publishedUrl) return [{ id: 'legacy', platform: post.platform, link: post.publishedUrl }];
  return [];
}

function renderPostBody(post: GeminiPost): React.ReactNode {
  if (post.tone === 'Resultado de Desafio' || post.tone === 'Manual') {
    const links = getPostLinks(post);
    if (links.length === 0) {
      return <span className="text-gray-400">Nenhum link adicionado.</span>;
    }
    return (
      <span className="flex flex-col gap-1.5">
        {links.filter((l) => isHttpUrl(l.link)).map((l) => (
          <a
            key={l.id}
            href={l.link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-[#1A73E8] font-bold hover:underline break-all"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            Ver publicação no {l.platform}
          </a>
        ))}
      </span>
    );
  }
  return renderLinkedContent(post.content);
}

export const GeminiPostsModule: React.FC<GeminiPostsModuleProps> = ({
  posts,
  onSavePost,
  onDeletePost,
  initialDraftTopic = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('Todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = usePersistedState('gsa_post_generator_open', false);
  const [selectedPostDetailId, setSelectedPostDetailId] = usePersistedState<string | null>('gsa_post_selected_id', null);

  const selectedPostDetail = selectedPostDetailId ? posts.find((p) => p.id === selectedPostDetailId) ?? null : null;

  const [editingPost, setEditingPost] = usePersistedState<Partial<GeminiPost> | null>('gsa_post_editing_draft', null);
  const [pendingLinkPlatform, setPendingLinkPlatform] = useState<PostPlatform>('LinkedIn');
  const [pendingLinkUrl, setPendingLinkUrl] = useState('');

  useEffect(() => {
    if (initialDraftTopic) {
      handleCreateManualPost(initialDraftTopic);
      setIsGeneratorModalOpen(true);
    }
  }, [initialDraftTopic]);

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hashtags.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase())) ||
      getPostLinks(p).some((l) => l.link.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPlatform = selectedPlatformFilter === 'Todos' || getPostPlatforms(p).includes(selectedPlatformFilter as PostPlatform);

    return matchesSearch && matchesPlatform;
  });

  const handleCopy = (post: GeminiPost) => {
    const text = post.tone === 'Manual'
      ? getPostLinks(post).map((l) => l.link).join('\n')
      : post.content;
    navigator.clipboard.writeText(text);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateManualPost = (title: string = '') => {
    setPendingLinkPlatform('LinkedIn');
    setPendingLinkUrl('');
    setEditingPost({
      id: crypto.randomUUID(),
      title,
      platform: 'LinkedIn',
      status: 'Publicado',
      category: '',
      tone: 'Manual',
      content: '',
      hashtags: [],
      socialLinks: [],
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddSocialLink = () => {
    const link = pendingLinkUrl.trim();
    if (!link) return;
    const newLink: ChallengeSocialLink = { id: crypto.randomUUID(), platform: pendingLinkPlatform, link };
    setEditingPost((prev) => prev && ({ ...prev, socialLinks: [...(prev.socialLinks || []), newLink] }));
    setPendingLinkUrl('');
  };

  const handleRemoveSocialLink = (id: string) => {
    setEditingPost((prev) => prev && ({ ...prev, socialLinks: (prev.socialLinks || []).filter((l) => l.id !== id) }));
  };

  const handleSavePostToLibrary = async () => {
    if (!editingPost || !editingPost.title) return;
    const isManual = editingPost.tone === 'Manual';
    const socialLinks = editingPost.socialLinks || [];
    if (isManual && socialLinks.length === 0) return;
    if (!isManual && !editingPost.content) return;

    const postToSave: GeminiPost = {
      id: editingPost.id || crypto.randomUUID(),
      title: editingPost.title,
      platform: isManual ? (socialLinks[0]?.platform || 'LinkedIn') : (editingPost.platform || 'LinkedIn'),
      status: editingPost.status || 'Rascunho',
      category: (editingPost.category || '').trim(),
      tone: editingPost.tone || 'Inspirador',
      content: editingPost.content || '',
      promptUsed: editingPost.promptUsed,
      hashtags: editingPost.hashtags || [],
      visualIdea: editingPost.visualIdea,
      scheduledDate: editingPost.scheduledDate,
      publishedUrl: isManual ? socialLinks[0]?.link : editingPost.publishedUrl,
      socialLinks: isManual ? socialLinks : editingPost.socialLinks,
      likes: editingPost.likes || 0,
      comments: editingPost.comments || 0,
      score: editingPost.score,
      createdAt: editingPost.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSavePost(postToSave);
    setIsGeneratorModalOpen(false);
    setEditingPost(null);

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#EA4335', '#1A73E8', '#34A853', '#FBBC04'],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#EA4335]" />
            <span>Posts Criados</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-create-post-gemini"
            onClick={() => {
              handleCreateManualPost();
              setIsGeneratorModalOpen(true);
            }}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-[#EA4335]/30 focus:border-[#EA4335] bg-gray-50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {['Todos', ...PLATFORMS].map((plt) => {
            const isSelected = selectedPlatformFilter === plt;
            return (
              <button
                key={plt}
                onClick={() => setSelectedPlatformFilter(plt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#EA4335] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                }`}
              >
                {plt}
              </button>
            );
          })}
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
            <div
              key={post.id}
              id={`post-card-${post.id}`}
              className="bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#EA4335]/50 transition-all p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getPostPlatforms(post).map((plt) => (
                      <span key={plt} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        plt === 'LinkedIn'
                          ? 'bg-[#0077B5]/10 text-[#0077B5]'
                          : plt === 'Instagram'
                          ? 'bg-[#E1306C]/10 text-[#E1306C]'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {plt}
                      </span>
                    ))}

                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      post.status === 'Publicado'
                        ? 'bg-green-100 text-green-700'
                        : post.status === 'Agendado'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {post.status}
                    </span>

                    {post.category && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        {post.category}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-400 font-medium">
                    {getPostDisplayDate(post)}
                  </span>
                </div>

                <h3 
                  onClick={() => setSelectedPostDetailId(post.id)}
                  className="text-base sm:text-lg font-bold text-gray-900 leading-snug cursor-pointer hover:text-[#EA4335]"
                >
                  {post.title}
                </h3>

                <div 
                  onClick={() => setSelectedPostDetailId(post.id)}
                  className="bg-[#F8FAFD] rounded-2xl p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap line-clamp-4 leading-relaxed">
                    {renderPostBody(post)}
                  </p>
                </div>

                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.hashtags.slice(0, 4).map((tag, idx) => (
                      <span key={idx} className="text-xs font-medium text-[#1A73E8]">
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                  {post.likes ? (
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-[#EA4335]" />
                      <span>{post.likes}</span>
                    </span>
                  ) : null}
                  {post.comments ? (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-[#1A73E8]" />
                      <span>{post.comments}</span>
                    </span>
                  ) : null}
                  {post.score ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-[#FBBC04]" />
                      <span>{post.score}</span>
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={async () => {
                      if (confirm('Deseja excluir este post?')) {
                        await onDeletePost(post.id);
                      }
                    }}
                    className="p-2 rounded-xl text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10"
                    aria-label="Excluir Post"
                    title="Excluir Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setPendingLinkPlatform('LinkedIn');
                      setPendingLinkUrl('');
                      setEditingPost(
                        post.tone === 'Manual' && !post.socialLinks?.length
                          ? { ...post, socialLinks: getPostLinks(post) }
                          : post
                      );
                      setIsGeneratorModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    aria-label="Editar Post"
                    title="Editar Post"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleCopy(post)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      copiedId === post.id
                        ? 'bg-[#34A853] text-white'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {copiedId === post.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {isGeneratorModalOpen && editingPost && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {posts.some((p) => p.id === editingPost.id) ? 'Editar Post' : 'Novo Post'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Registre um post que você já publicou.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsGeneratorModalOpen(false);
                  setEditingPost(null);
                }}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={editingPost.title || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {editingPost.tone !== 'Manual' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Plataforma
                      </label>
                      <div className="relative">
                        <select
                          value={editingPost.platform || 'LinkedIn'}
                          onChange={(e) => setEditingPost({ ...editingPost, platform: e.target.value as PostPlatform })}
                          className="appearance-none w-full px-3.5 py-2 pr-8 rounded-xl text-sm border border-gray-200 bg-gray-50 cursor-pointer"
                        >
                          {PLATFORMS.map((plt) => (
                            <option key={plt} value={plt}>{plt}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Status da Publicação
                    </label>
                    <div className="relative">
                      <select
                        value={editingPost.status || 'Rascunho'}
                        onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as PostStatus })}
                        className="appearance-none w-full px-3.5 py-2 pr-8 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD] cursor-pointer"
                      >
                        <option value="Rascunho">Rascunho</option>
                        <option value="Agendado">Agendado</option>
                        <option value="Publicado">Publicado</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Pontuação
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editingPost.score ?? ''}
                      onChange={(e) => setEditingPost({ ...editingPost, score: e.target.value === '' ? undefined : Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50"
                    />
                  </div>

                  {editingPost.tone !== 'Resultado de Desafio' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Data
                      </label>
                      <DatePicker
                        id="post-form-date"
                        value={editingPost.createdAt ? toLocalDateInputValue(editingPost.createdAt) : ''}
                        onChange={(date) => {
                          if (!date) return;
                          setEditingPost({ ...editingPost, createdAt: new Date(`${date}T12:00:00`).toISOString() });
                        }}
                      />
                    </div>
                  )}
                </div>

                {editingPost.tone === 'Resultado de Desafio' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Link da Publicação
                    </label>
                    <div className="flex items-center gap-1.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                      {isHttpUrl(editingPost.publishedUrl) ? (
                        <a
                          href={editingPost.publishedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1A73E8] hover:underline break-all"
                        >
                          <Share2 className="w-4 h-4 shrink-0" />
                          Ver publicação{editingPost.platform ? ` no ${editingPost.platform}` : ''}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">Nenhum link sincronizado.</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      Este post é sincronizado com um desafio na tela de Desafios — edite o link por lá.
                    </p>
                  </div>
                ) : editingPost.tone === 'Manual' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 items-end">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Plataforma</label>
                        <div className="relative">
                          <select
                            value={pendingLinkPlatform}
                            onChange={(e) => setPendingLinkPlatform(e.target.value as PostPlatform)}
                            className="appearance-none w-full pl-3.5 pr-8 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 cursor-pointer"
                          >
                            {PLATFORMS.map((plt) => (
                              <option key={plt} value={plt}>{plt}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Link da publicação</label>
                        <input
                          type="url"
                          value={pendingLinkUrl}
                          onChange={(e) => setPendingLinkUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSocialLink}
                        disabled={!pendingLinkUrl.trim()}
                        className="px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Adicionar
                      </button>
                    </div>

                    {editingPost.socialLinks && editingPost.socialLinks.length > 0 && (
                      <div className="space-y-1.5">
                        {editingPost.socialLinks.map((social) => (
                          <div
                            key={social.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
                          >
                            <Share2 className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                            <span className="text-xs font-bold text-gray-700 shrink-0">{social.platform}</span>
                            <span className="text-xs text-gray-500 truncate flex-1">{social.link}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSocialLink(social.id)}
                              aria-label="Remover link"
                              className="p-1 rounded-lg text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-end mb-1">
                        <span className="text-[11px] text-gray-500">
                          {editingPost.content?.length || 0} caracteres
                        </span>
                      </div>
                      <textarea
                        rows={8}
                        placeholder="Escreva o conteúdo do post..."
                        value={editingPost.content || ''}
                        onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#EA4335]/30 leading-relaxed font-sans"
                      />
                    </div>

                    {editingPost.visualIdea && (
                      <div className="p-3.5 rounded-2xl bg-[#FBBC04]/15 border border-[#FBBC04]/30 flex items-start gap-2.5">
                        <ImageIcon className="w-4 h-4 text-[#B06000] shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <strong className="text-gray-900 font-semibold">Sugestão de Mídia / Imagem:</strong>
                          <p className="text-gray-700 mt-0.5">{editingPost.visualIdea}</p>
                        </div>
                      </div>
                    )}

                    {editingPost.status === 'Publicado' && (
                      <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Link da Postagem</label>
                        <input
                          type="url"
                          value={editingPost.publishedUrl || ''}
                          onChange={(e) => setEditingPost({ ...editingPost, publishedUrl: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg text-xs border border-gray-300 bg-white"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPost(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePostToLibrary}
                    className="px-6 py-2 rounded-xl text-xs font-bold bg-[#EA4335] hover:bg-[#D93025] text-white shadow-xs transition-all active:scale-95"
                  >
                    Salvar
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {selectedPostDetail && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                {getPostPlatforms(selectedPostDetail).map((plt) => (
                  <span key={plt} className="px-3 py-1 rounded-full text-xs font-bold bg-[#EA4335] text-white">
                    {plt}
                  </span>
                ))}
                <span className="text-xs text-gray-500 font-medium">
                  {getPostDisplayDate(selectedPostDetail)}
                </span>
              </div>
              <button
                onClick={() => setSelectedPostDetailId(null)}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedPostDetail.title}</h3>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {renderPostBody(selectedPostDetail)}
              </div>

              {selectedPostDetail.hashtags && selectedPostDetail.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPostDetail.hashtags.map((h, i) => (
                    <span key={i} className="text-xs font-semibold text-[#1A73E8]">
                      {h.startsWith('#') ? h : `#${h}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={async () => {
                  if (confirm('Deseja excluir esta publicação?')) {
                    await onDeletePost(selectedPostDetail.id);
                    setSelectedPostDetailId(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA4335] hover:bg-[#EA4335]/10 px-3 py-2 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>

              <button
                onClick={() => {
                  const text = selectedPostDetail.tone === 'Manual'
                    ? getPostLinks(selectedPostDetail).map((l) => l.link).join('\n')
                    : selectedPostDetail.content;
                  navigator.clipboard.writeText(text);
                  alert('Post copiado!');
                }}
                className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Post</span>
              </button>
            </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};