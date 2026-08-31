import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
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
  List,
  CalendarDays
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GeminiPost, PostPlatform, PostStatus } from '../types';
import { GeminiApiService } from '../services/geminiApi';
import { usePersistedState } from '../hooks/usePersistedState';
import { ContentCalendar } from './ContentCalendar';

interface GeminiPostsModuleProps {
  posts: GeminiPost[];
  onSavePost: (post: GeminiPost) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
  initialDraftTopic?: string;
}

const PLATFORMS: PostPlatform[] = [
  'LinkedIn',
  'Instagram',
  'Medium / Dev.to',
  'Twitter / X',
  'WhatsApp / Comunidade',
];

const TONES = [
  'Inspirador & Profissional',
  'Educacional & Prático',
  'Storytelling Pessoal',
  'Descontraído & Tech',
  'Chamada para Ação / Evento',
];

const DEFAULT_GENERATOR_DATA = {
  topic: '',
  platform: 'LinkedIn' as PostPlatform,
  tone: 'Inspirador & Profissional',
  category: 'Estudos & IA',
  keyPoints: '',
  callToAction: 'Deixe um comentário com suas impressões e compartilhe com amigos!',
  customInstructions: '',
};

export const GeminiPostsModule: React.FC<GeminiPostsModuleProps> = ({
  posts,
  onSavePost,
  onDeletePost,
  initialDraftTopic = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('Todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = usePersistedState<'list' | 'calendar'>('gsa_posts_view_mode', 'list');
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = usePersistedState('gsa_post_generator_open', false);
  const [selectedPostDetailId, setSelectedPostDetailId] = usePersistedState<string | null>('gsa_post_selected_id', null);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedPostDetail = selectedPostDetailId ? posts.find((p) => p.id === selectedPostDetailId) ?? null : null;

  const [generatorData, setGeneratorData] = usePersistedState('gsa_post_generator_draft', {
    ...DEFAULT_GENERATOR_DATA,
    topic: initialDraftTopic || '',
  });

  const [editingPost, setEditingPost] = usePersistedState<Partial<GeminiPost> | null>('gsa_post_editing_draft', null);

  useEffect(() => {
    if (initialDraftTopic) {
      setGeneratorData((prev) => ({ ...prev, topic: initialDraftTopic }));
      setIsGeneratorModalOpen(true);
    }
  }, [initialDraftTopic]);

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hashtags.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPlatform = selectedPlatformFilter === 'Todos' || p.platform === selectedPlatformFilter;
    const matchesStatus = selectedStatusFilter === 'Todos' || p.status === selectedStatusFilter;

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const handleCopy = (post: GeminiPost) => {
    navigator.clipboard.writeText(post.content);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGeneratePostWithGemini = async () => {
    if (!generatorData.topic) return;

    setIsGenerating(true);
    try {
      const generatedContent = await GeminiApiService.generatePost({
        topic: generatorData.topic,
        platform: generatorData.platform,
        tone: generatorData.tone,
        category: generatorData.category,
        keyPoints: generatorData.keyPoints,
        callToAction: generatorData.callToAction,
        customInstructions: generatorData.customInstructions,
      });

      const hashtagsMatch = generatedContent.match(/#[a-zA-Z0-9_]+/g) || [
        '#GoogleStudentAmbassador',
        '#Google2026',
        '#GeminiAI',
        '#TechCommunity',
      ];

      setEditingPost({
        id: crypto.randomUUID(),
        title: generatorData.topic,
        platform: generatorData.platform,
        status: 'Rascunho',
        category: generatorData.category,
        tone: generatorData.tone,
        content: generatedContent,
        promptUsed: `Post para ${generatorData.platform} sobre ${generatorData.topic} com tom ${generatorData.tone}`,
        hashtags: Array.from(new Set(hashtagsMatch)),
        visualIdea: 'Foto do evento ou mockup do projeto com cores Google.',
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#EA4335', '#1A73E8', '#FBBC04'],
      });
    } catch (err: any) {
      alert(`Erro ao gerar post com Gemini: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReschedulePost = async (post: GeminiPost, newDate: string) => {
    await onSavePost({
      ...post,
      scheduledDate: newDate,
      status: post.status === 'Rascunho' ? 'Agendado' : post.status,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSavePostToLibrary = async () => {
    if (!editingPost || !editingPost.title || !editingPost.content) return;

    const postToSave: GeminiPost = {
      id: editingPost.id || crypto.randomUUID(),
      title: editingPost.title,
      platform: editingPost.platform || 'LinkedIn',
      status: editingPost.status || 'Rascunho',
      category: editingPost.category || 'Estudos',
      tone: editingPost.tone || 'Inspirador',
      content: editingPost.content,
      promptUsed: editingPost.promptUsed,
      hashtags: editingPost.hashtags || [],
      visualIdea: editingPost.visualIdea,
      scheduledDate: editingPost.scheduledDate,
      publishedUrl: editingPost.publishedUrl,
      likes: editingPost.likes || 0,
      comments: editingPost.comments || 0,
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
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('list')}
              aria-label="Visualização em lista"
              aria-pressed={viewMode === 'list'}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              aria-label="Visualização em calendário"
              aria-pressed={viewMode === 'calendar'}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'calendar' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Visualização em Calendário"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-create-post-gemini"
            onClick={() => {
              setEditingPost(null);
              setGeneratorData({
                topic: '',
                platform: 'LinkedIn',
                tone: 'Inspirador & Profissional',
                category: 'Estudos & IA',
                keyPoints: '',
                callToAction: 'Deixe sua opinião nos comentários e conecte-se!',
                customInstructions: '',
              });
              setIsGeneratorModalOpen(true);
            }}
            aria-label="Novo post"
            title="Novo post"
            className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Novo post</span>
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <ContentCalendar
          posts={posts}
          onSelectPost={(post) => setSelectedPostDetailId(post.id)}
          onReschedulePost={handleReschedulePost}
        />
      ) : (
      <>
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

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                aria-label="Filtrar por status"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#EA4335]/30"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Publicado">Apenas Publicados</option>
                <option value="Rascunho">Apenas Rascunhos</option>
                <option value="Agendado">Apenas Agendados</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
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
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      post.platform === 'LinkedIn'
                        ? 'bg-[#0077B5]/10 text-[#0077B5]'
                        : post.platform === 'Instagram'
                        ? 'bg-[#E1306C]/10 text-[#E1306C]'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {post.platform}
                    </span>

                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      post.status === 'Publicado'
                        ? 'bg-green-100 text-green-700'
                        : post.status === 'Agendado'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {post.status}
                    </span>
                  </div>

                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
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
                    {post.content}
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
                      setEditingPost(post);
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
      </>
      )}

      {isGeneratorModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#FBBC04]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {editingPost ? 'Refinar e Salvar Post' : 'Criador de Posts com Gemini 3.7'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Gere conteúdo viral e autêntico para sua audiência acadêmica e profissional.
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

            {!editingPost ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tema ou Conquista Principal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Conclusão do curso de GenAI do Google Cloud ou Workshop no Campus"
                    value={generatorData.topic}
                    onChange={(e) => setGeneratorData({ ...generatorData, topic: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#EA4335]/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Plataforma Alvo
                    </label>
                    <select
                      value={generatorData.platform}
                      onChange={(e) => setGeneratorData({ ...generatorData, platform: e.target.value as PostPlatform })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                    >
                      {PLATFORMS.map((plt) => (
                        <option key={plt} value={plt}>{plt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Tom de Voz
                    </label>
                    <select
                      value={generatorData.tone}
                      onChange={(e) => setGeneratorData({ ...generatorData, tone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                    >
                      {TONES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Pontos-chave & Destaques
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: 120 alunos presentes, demonstração ao vivo de Gemini Flash, entrega de certificados..."
                    value={generatorData.keyPoints}
                    onChange={(e) => setGeneratorData({ ...generatorData, keyPoints: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Chamada para Ação (CTA)
                  </label>
                  <input
                    type="text"
                    value={generatorData.callToAction}
                    onChange={(e) => setGeneratorData({ ...generatorData, callToAction: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD]"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGeneratorModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleGeneratePostWithGemini}
                    disabled={isGenerating || !generatorData.topic}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#EA4335] hover:bg-[#D93025] text-white shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Gerando Post com Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#FBBC04]" />
                        <span>Gerar Post com IA</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Título / Tema do Post
                    </label>
                    <input
                      type="text"
                      value={editingPost.title || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Status da Publicação
                    </label>
                    <select
                      value={editingPost.status || 'Rascunho'}
                      onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as PostStatus })}
                      className="w-full px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD]"
                    >
                      <option value="Rascunho">Rascunho</option>
                      <option value="Agendado">Agendado</option>
                      <option value="Publicado">Publicado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Conteúdo do Post (Markdown)
                    </label>
                    <span className="text-[11px] text-gray-500">
                      {editingPost.content?.length || 0} caracteres
                    </span>
                  </div>
                  <textarea
                    rows={8}
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Curtidas / Likes</label>
                      <input
                        type="number"
                        value={editingPost.likes || 0}
                        onChange={(e) => setEditingPost({ ...editingPost, likes: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-lg text-xs border border-gray-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Comentários</label>
                      <input
                        type="number"
                        value={editingPost.comments || 0}
                        onChange={(e) => setEditingPost({ ...editingPost, comments: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-lg text-xs border border-gray-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Link da Postagem</label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/posts/..."
                        value={editingPost.publishedUrl || ''}
                        onChange={(e) => setEditingPost({ ...editingPost, publishedUrl: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg text-xs border border-gray-300 bg-white"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(editingPost.content || '');
                      alert('Conteúdo copiado com sucesso!');
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </button>

                  <div className="flex items-center gap-2">
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
                      Salvar Post na Biblioteca
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {selectedPostDetail && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EA4335] text-white">
                  {selectedPostDetail.platform}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(selectedPostDetail.createdAt).toLocaleDateString('pt-BR')}
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
                {selectedPostDetail.content}
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
                  navigator.clipboard.writeText(selectedPostDetail.content);
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
      )}

    </div>
  );
};