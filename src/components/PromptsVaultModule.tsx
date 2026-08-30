import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Plus, 
  Search, 
  Star, 
  Play, 
  Wand2, 
  Trash2, 
  X, 
  Tag, 
  BookOpen, 
  Layers, 
  Send,
  Zap,
  CheckCircle2,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PromptItem, PromptSection } from '../types';
import { GeminiApiService } from '../services/geminiApi';

interface PromptsVaultModuleProps {
  prompts: PromptItem[];
  onSavePrompt: (prompt: PromptItem) => Promise<void>;
  onDeletePrompt: (id: string) => Promise<void>;
}

const SECTIONS: PromptSection[] = [
  'Estudos',
  'Workshops & Eventos',
  'Criação de Conteúdo',
  'Carreira Tech',
  'Pesquisa & IA',
  'Comunidade & Liderança',
];

export const PromptsVaultModule: React.FC<PromptsVaultModuleProps> = ({
  prompts,
  onSavePrompt,
  onDeletePrompt,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals & Runners
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testingPrompt, setTestingPrompt] = useState<PromptItem | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [aiExecutionResult, setAiExecutionResult] = useState<string | null>(null);
  const [isExecutingAi, setIsExecutingAi] = useState(false);

  // AI Prompt Enhancer
  const [enhancingPrompt, setEnhancingPrompt] = useState<PromptItem | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // New Prompt Form
  const [formData, setFormData] = useState<Partial<PromptItem>>({
    title: '',
    promptText: '',
    section: 'Estudos',
    tags: [],
    variables: [],
    recommendedModel: 'gemini-3.7-flash',
    isFavorite: false,
    usageCount: 0,
  });
  const [tagInput, setTagInput] = useState('');
  const [varInput, setVarInput] = useState('');

  // Filtering
  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.promptText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSection = selectedSection === 'Todos' || p.section === selectedSection;
    const matchesFav = !onlyFavorites || p.isFavorite;

    return matchesSearch && matchesSection && matchesFav;
  });

  const handleCopyPrompt = (prompt: PromptItem) => {
    navigator.clipboard.writeText(prompt.promptText);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Increase usage count
    onSavePrompt({
      ...prompt,
      usageCount: (prompt.usageCount || 0) + 1,
      lastUsed: new Date().toISOString(),
    });
  };

  const toggleFavorite = async (prompt: PromptItem) => {
    await onSavePrompt({
      ...prompt,
      isFavorite: !prompt.isFavorite,
    });
  };

  // Open Live Tester for a prompt
  const openTester = (prompt: PromptItem) => {
    setTestingPrompt(prompt);
    setAiExecutionResult(null);
    const initialVars: Record<string, string> = {};
    prompt.variables?.forEach((v) => {
      initialVars[v] = '';
    });
    setVariableValues(initialVars);
  };

  // Run Prompt Live on Gemini
  const handleExecuteLivePrompt = async () => {
    if (!testingPrompt) return;
    setIsExecutingAi(true);
    setAiExecutionResult(null);

    try {
      let finalPrompt = testingPrompt.promptText;
      Object.entries(variableValues).forEach(([key, val]) => {
        if (val) {
          const regex = new RegExp(`\\[${key}\\]|\\[INSERIR ${key}[^\\]]*\\]`, 'gi');
          finalPrompt = finalPrompt.replace(regex, val);
        }
      });

      const reply = await GeminiApiService.sendChatMessage(finalPrompt);
      setAiExecutionResult(reply);

      // Increase usage
      await onSavePrompt({
        ...testingPrompt,
        usageCount: (testingPrompt.usageCount || 0) + 1,
        lastUsed: new Date().toISOString(),
      });
    } catch (err: any) {
      setAiExecutionResult(`Erro ao executar prompt: ${err.message || 'Verifique sua conexão.'}`);
    } finally {
      setIsExecutingAi(false);
    }
  };

  // Enhance Prompt with Gemini
  const handleEnhanceWithGemini = async (prompt: PromptItem) => {
    setEnhancingPrompt(prompt);
    setIsEnhancing(true);
    setEnhancedResult(null);

    try {
      const result = await GeminiApiService.enhancePrompt({
        prompt: prompt.promptText,
        section: prompt.section,
        objective: 'Melhorar precisão, formatação e resultados gerados no Gemini 3.7',
      });
      setEnhancedResult(result);
    } catch (err: any) {
      setEnhancedResult(`Erro ao aprimorar prompt: ${err.message}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Add Tag / Variable
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const tag = tagInput.trim();
    if (!formData.tags?.includes(tag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
    }
    setTagInput('');
  };

  const handleAddVar = () => {
    if (!varInput.trim()) return;
    const v = varInput.trim().toUpperCase();
    if (!formData.variables?.includes(v)) {
      setFormData({ ...formData, variables: [...(formData.variables || []), v] });
    }
    setVarInput('');
  };

  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.promptText) return;

    const newPrompt: PromptItem = {
      id: formData.id || crypto.randomUUID(),
      title: formData.title || 'Novo Prompt',
      promptText: formData.promptText || '',
      section: (formData.section as PromptSection) || 'Estudos',
      tags: formData.tags || [],
      variables: formData.variables || [],
      recommendedModel: formData.recommendedModel || 'gemini-3.7-flash',
      isFavorite: formData.isFavorite || false,
      usageCount: formData.usageCount || 0,
      createdAt: new Date().toISOString(),
    };

    await onSavePrompt(newPrompt);
    setIsAddModalOpen(false);
    resetForm();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#FBBC04', '#1A73E8', '#34A853'],
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      promptText: '',
      section: 'Estudos',
      tags: [],
      variables: [],
      recommendedModel: 'gemini-3.7-flash',
      isFavorite: false,
      usageCount: 0,
    });
    setTagInput('');
    setVarInput('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header & New Prompt Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#FBBC04]" />
            <span>Banco de Prompts por Seção</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Biblioteca de prompts testados para acelerar seus estudos, workshops universitários e liderança com Gemini.
          </p>
        </div>

        <button
          id="btn-new-prompt"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FBBC04] hover:bg-[#F59E0B] text-gray-950 font-bold text-sm shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar Novo Prompt</span>
        </button>
      </div>

      {/* Filter and Section Selector */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-prompts-input"
              type="text"
              placeholder="Buscar prompt por palavra-chave, tema ou seção (ex: Feynman, Workshop, Instagram)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-[#FBBC04]/40 focus:border-[#FBBC04] bg-gray-50"
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

          {/* Favorites Filter */}
          <button
            id="filter-favorites-prompts"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              onlyFavorites
                ? 'bg-[#FBBC04]/20 border-[#FBBC04] text-[#9E5D00]'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-[#FBBC04] text-[#FBBC04]' : 'text-gray-400'}`} />
            <span>Favoritos</span>
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {['Todos', ...SECTIONS].map((sec) => {
            const isSelected = selectedSection === sec;
            return (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                }`}
              >
                {sec}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompts Cards Grid */}
      {filteredPrompts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FBBC04]/15 text-[#B06000] flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum prompt encontrado</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Tente outro termo de busca ou adicione um novo prompt para a seção selecionada.
          </p>
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FBBC04] text-gray-900 text-sm font-bold hover:bg-[#F59E0B]"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Prompt</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              id={`prompt-card-${prompt.id}`}
              className="bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#FBBC04]/60 transition-all p-6 flex flex-col justify-between space-y-4"
            >
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    prompt.section === 'Estudos'
                      ? 'bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20'
                      : prompt.section === 'Workshops & Eventos'
                      ? 'bg-[#34A853]/10 text-[#2E7D32] border border-[#34A853]/20'
                      : prompt.section === 'Criação de Conteúdo'
                      ? 'bg-[#EA4335]/10 text-[#D93025] border border-[#EA4335]/20'
                      : prompt.section === 'Carreira Tech'
                      ? 'bg-[#FBBC04]/20 text-[#8F5200] border border-[#FBBC04]/30'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {prompt.section}
                  </span>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-mono text-gray-400">
                      Usado {prompt.usageCount || 0}x
                    </span>
                    <button
                      onClick={() => toggleFavorite(prompt)}
                      className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#FBBC04] transition-colors"
                    >
                      <Star className={`w-4 h-4 ${prompt.isFavorite ? 'fill-[#FBBC04] text-[#FBBC04]' : ''}`} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                  {prompt.title}
                </h3>

                {/* Prompt Code Container */}
                <div className="relative group bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-700 font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">
                    {prompt.promptText}
                  </p>
                </div>

                {/* Tags & Variables Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {prompt.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}

                  {prompt.variables && prompt.variables.length > 0 && (
                    prompt.variables.map((v, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#1A73E8]/10 text-[#1A73E8]"
                      >
                        [{v}]
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Test / Run Live with Gemini */}
                  <button
                    onClick={() => openTester(prompt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A73E8]/10 hover:bg-[#1A73E8]/20 text-[#1A73E8] text-xs font-bold transition-all active:scale-95"
                    aria-label="Testar prompt com Gemini"
                    title="Testar prompt com Gemini"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#1A73E8]" />
                    <span>Testar com Gemini</span>
                  </button>

                  {/* AI Enhance */}
                  <button
                    onClick={() => handleEnhanceWithGemini(prompt)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-semibold transition-all"
                    aria-label="Aprimorar prompt com IA"
                    title="Aprimorar prompt com IA"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-[#FBBC04]" />
                    <span className="hidden sm:inline">Aprimorar</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={async () => {
                      if (confirm('Deseja excluir este prompt?')) {
                        await onDeletePrompt(prompt.id);
                      }
                    }}
                    className="p-2 rounded-xl text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10"
                    aria-label="Excluir"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Copy Prompt Button */}
                  <button
                    onClick={() => handleCopyPrompt(prompt)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      copiedId === prompt.id
                        ? 'bg-[#34A853] text-white shadow-xs'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {copiedId === prompt.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Prompt</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* -------------------- MODAL: CREATE / NEW PROMPT -------------------- */}
      {isAddModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBBC04]/20 text-[#8F5200] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Cadastrar Prompt por Seção
                  </h3>
                  <p className="text-xs text-gray-500">
                    Salve prompts reutilizáveis com parâmetros e variáveis.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPrompt} className="space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Título do Prompt *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Simulação de Entrevista Técnica Google"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#FBBC04]/40"
                />
              </div>

              {/* Section & Recommended Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Seção / Categoria *
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value as PromptSection })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                  >
                    {SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Modelo Recomendado
                  </label>
                  <select
                    value={formData.recommendedModel}
                    onChange={(e) => setFormData({ ...formData, recommendedModel: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                  >
                    <option value="gemini-3.7-flash">Gemini 3.7 Flash (Rápido & Inteligente)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Raciocínio Profundo)</option>
                    <option value="gemini-3.1-flash-lite">Gemini Flash Lite (Super Leve)</option>
                  </select>
                </div>
              </div>

              {/* Prompt Text Area */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Texto do Prompt *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Escreva a instrução completa. Dica: Use colchetes para variáveis como [TÓPICO] ou [PÚBLICO]..."
                  value={formData.promptText}
                  onChange={(e) => setFormData({ ...formData, promptText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#FBBC04]/40"
                />
              </div>

              {/* Variables Management */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Variáveis / Parâmetros do Prompt
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar variável (ex: TEMA, PÚBLICO, NÍVEL)..."
                    value={varInput}
                    onChange={(e) => setVarInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddVar();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddVar}
                    className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold"
                  >
                    + Variável
                  </button>
                </div>
                {formData.variables && formData.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.variables.map((v, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1A73E8]/10 text-[#1A73E8]"
                      >
                        [{v}]
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, variables: formData.variables?.filter((x) => x !== v) })}
                          className="hover:text-[#EA4335]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Tags de Busca
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar tag (ex: Estudos, Produtividade, Python)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold"
                  >
                    + Tag
                  </button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, tags: formData.tags?.filter((t) => t !== tag) })}
                          className="hover:text-[#EA4335]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#FBBC04] hover:bg-[#F59E0B] text-gray-950 shadow-sm transition-all active:scale-95"
                >
                  Salvar no Banco de Prompts
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* -------------------- MODAL: TEST PROMPT LIVE WITH GEMINI -------------------- */}
      {testingPrompt && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center">
                  <Play className="w-5 h-5 fill-[#1A73E8]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Testar Prompt com Gemini 3.7
                  </h3>
                  <p className="text-xs text-gray-500">
                    {testingPrompt.title} • {testingPrompt.section}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTestingPrompt(null)}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Variable Inputs */}
            {testingPrompt.variables && testingPrompt.variables.length > 0 && (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Preencher Parâmetros do Prompt:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {testingPrompt.variables.map((v) => (
                    <div key={v}>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        [{v}]
                      </label>
                      <input
                        type="text"
                        placeholder={`Digite o valor para ${v}...`}
                        value={variableValues[v] || ''}
                        onChange={(e) => setVariableValues({ ...variableValues, [v]: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-xs border border-gray-300 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Template Preview */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Prompt Base
              </label>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {testingPrompt.promptText}
              </div>
            </div>

            {/* AI Output Area */}
            {aiExecutionResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#34A853] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resposta Gerada pelo Gemini 3.7:</span>
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiExecutionResult);
                      alert('Resposta copiada para a área de transferência!');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Resposta</span>
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-300 shadow-inner text-xs sm:text-sm text-gray-800 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                  {aiExecutionResult}
                </div>
              </div>
            )}

            {/* Execute Button */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTestingPrompt(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Fechar
              </button>

              <button
                onClick={handleExecuteLivePrompt}
                disabled={isExecutingAi}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1A73E8] hover:bg-[#1A73E8] text-white shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isExecutingAi ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processando no Gemini...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Executar no Gemini Agora</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------- MODAL: AI PROMPT ENHANCER -------------------- */}
      {enhancingPrompt && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBBC04]/20 text-[#8F5200] flex items-center justify-center">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Otimizador de Prompts com Gemini
                  </h3>
                  <p className="text-xs text-gray-500">
                    Engenharia de prompts avançada para o programa Google 2026.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEnhancingPrompt(null)}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEnhancing ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 border-3 border-[#FBBC04] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-gray-700">
                  O Gemini está aprimorando a estrutura, persona e clareza do seu prompt...
                </p>
              </div>
            ) : enhancedResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                  {enhancedResult}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(enhancedResult);
                      alert('Prompt aprimorado copiado com sucesso!');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#FBBC04] text-gray-950 text-xs font-bold hover:bg-[#F59E0B] flex items-center gap-1.5 shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Prompt Aprimorado</span>
                  </button>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
};
