import React, { useState } from 'react';
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
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GeminiPost, PostPlatform, PostStatus } from '../types';
import { GeminiApiService } from '../services/geminiApi';

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

  // Modals & Generator State
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState<GeminiPost | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generator Form
  const [generatorData, setGeneratorData] = useState({
    topic: initialDraftTopic || '',
    platform: 'LinkedIn' as PostPlatform,
    tone: 'Inspirador & Profissional',
    category: 'Estudos & IA',
    keyPoints: '',
    callToAction: 'Deixe um comentário com suas impressões e compartilhe com amigos!',
    customInstructions: '',
  });

  // Generated Post for Editing
  const [editingPost, setEditingPost] = useState<Partial<GeminiPost> | null>(null);

  // Filtering
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

      // Extract suggested hashtags if available
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
      
      {/* Header & Generate Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#EA4335]" />
            <span>Posts Criados com Gemini</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gere, refine e arquive todas as suas postagens para LinkedIn, Instagram e comunidades como Embaixadora do Google.
          </p>
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
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#EA4335] hover:bg-[#D93025] text-white font-bold text-sm shadow-sm transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-[#FBBC04]" />
          <span>+ Criar Novo Post com IA</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar posts por tema, conteúdo ou hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-[#EA4335]/30 focus:border-[#EA4335] bg-[#F8FAFD]"
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

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-700 focus:outline-none"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Publicado">Apenas Publicados</option>
            <option value="Rascunho">Apenas Rascunhos</option>
            <option value="Agendado">Apenas Agendados</option>
          </select>
        </div>

        {/* Platform Pills */}
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

      {/* Posts Content Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum post encontrado</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Crie sua primeira postagem com o Gemini 3.7 para divulgar suas conquistas como Embaixadora!
          </p>
          <button
            onClick={() => {
              setEditingPost(null);
              setIsGeneratorModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EA4335] text-white text-sm font-bold hover:bg-[#D93025]"
          >
            <Sparkles className="w-4 h-4 text-[#FBBC04]" />
            <span>Gerar Post com IA</span>
          </button>
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
                {/* Platform & Status Header */}
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
                  onClick={() => setSelectedPostDetail(post)}
                  className="text-base sm:text-lg font-bold text-gray-900 leading-snug cursor-pointer hover:text-[#EA4335]"
                >
                  {post.title}
                </h3>

                {/* Post Content Snippet */}
                <div 
                  onClick={() => setSelectedPostDetail(post)}
                  className="bg-[#F8FAFD] rounded-2xl p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap line-clamp-4 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Hashtags */}
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

              {/* Footer Actions */}
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

                  {/* Copy Content Button */}
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

      {/* -------------------- MODAL: GEMINI POST GENERATOR / EDITOR -------------------- */}
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
              /* Generator Step 1: Input Options */
              <div className="space-y-4">
                
                {/* Topic / Subject */}
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
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD] focus:ring-2 focus:ring-[#EA4335]/30"
                  />
                </div>

                {/* Platform & Tone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Plataforma Alvo
                    </label>
                    <select
                      value={generatorData.platform}
                      onChange={(e) => setGeneratorData({ ...generatorData, platform: e.target.value as PostPlatform })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD]"
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
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD]"
                    >
                      {TONES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Key Points */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Pontos-chave & Destaques
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: 120 alunos presentes, demonstração ao vivo de Gemini Flash, entrega de certificados..."
                    value={generatorData.keyPoints}
                    onChange={(e) => setGeneratorData({ ...generatorData, keyPoints: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD]"
                  />
                </div>

                {/* Call to Action */}
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

                {/* Action Button */}
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
              /* Generator Step 2: Live Editor & Library Archiving */
              <div className="space-y-4">
                
                {/* Title & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Título / Tema do Post
                    </label>
                    <input
                      type="text"
                      value={editingPost.title || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD]"
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

                {/* Content Editor */}
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
                    className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-gray-200 bg-[#F8FAFD] focus:ring-2 focus:ring-[#EA4335]/30 leading-relaxed font-sans"
                  />
                </div>

                {/* Visual Idea */}
                {editingPost.visualIdea && (
                  <div className="p-3.5 rounded-2xl bg-[#FBBC04]/15 border border-[#FBBC04]/30 flex items-start gap-2.5">
                    <ImageIcon className="w-4 h-4 text-[#B06000] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-gray-900 font-semibold">Sugestão de Mídia / Imagem:</strong>
                      <p className="text-gray-700 mt-0.5">{editingPost.visualIdea}</p>
                    </div>
                  </div>
                )}

                {/* Engagement / Published URL */}
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

                {/* Modal Footer Actions */}
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

      {/* -------------------- MODAL: POST DETAIL VIEW -------------------- */}
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
                onClick={() => setSelectedPostDetail(null)}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedPostDetail.title}</h3>

              <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
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
                    setSelectedPostDetail(null);
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
