import React, { useState, useRef, useEffect } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';
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
  Zap,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Paperclip,
  FileText,
  FileDown,
  ChevronDown,
  Link2,
  Upload,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PromptItem, PromptDoc } from '../types';
import { GeminiApiService } from '../services/geminiApi';
import { SupabaseStorageService } from '../services/supabaseStorage';
import { exportPromptsAsPdf } from '../utils/promptsExport';

interface PromptsVaultModuleProps {
  prompts: PromptItem[];
  onSavePrompt: (prompt: PromptItem) => Promise<void>;
  onDeletePrompt: (id: string) => Promise<void>;
  promptDocs: PromptDoc[];
  onSavePromptDoc: (doc: PromptDoc) => Promise<void>;
  onDeletePromptDoc: (id: string) => Promise<void>;
}

const DEFAULT_PROMPT_FORM: Partial<PromptItem> = {
  title: '',
  promptText: '',
  section: 'Estudos',
  tags: [],
  variables: [],
  sharedDocs: [],
  recommendedModel: 'gemini-3.7-flash',
  isFavorite: false,
  usageCount: 0,
};

export const PromptsVaultModule: React.FC<PromptsVaultModuleProps> = ({
  prompts,
  onSavePrompt,
  onDeletePrompt,
  promptDocs,
  onSavePromptDoc,
  onDeletePromptDoc,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isExportSelectOpen, setIsExportSelectOpen] = useState(false);
  const [selectedExportIds, setSelectedExportIds] = useState<Set<string>>(new Set());

  const [isAddModalOpen, setIsAddModalOpen] = usePersistedState('gsa_prompt_modal_open', false);
  const [testingPrompt, setTestingPrompt] = useState<PromptItem | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [aiExecutionResult, setAiExecutionResult] = useState<string | null>(null);
  const [isExecutingAi, setIsExecutingAi] = useState(false);

  const [testFilePreview, setTestFilePreview] = useState<string | null>(null);
  const [testFileName, setTestFileName] = useState('');
  const [testFileMimeType, setTestFileMimeType] = useState('');
  const [testFileError, setTestFileError] = useState<string | null>(null);
  const [isDraggingTestFile, setIsDraggingTestFile] = useState(false);
  const testFileInputRef = useRef<HTMLInputElement>(null);
  const MAX_TEST_FILE_SIZE_BYTES = 4 * 1024 * 1024; 
  const MAX_DOC_FILE_SIZE_BYTES = 1024 * 1024 * 1024; 
  const ACCEPTED_TEST_FILE_TYPES = [
    'image/png',
    'image/jpeg',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
  ];

  const [isDocsLibraryOpen, setIsDocsLibraryOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [isDraggingDocUpload, setIsDraggingDocUpload] = useState(false);
  const docUploadInputRef = useRef<HTMLInputElement>(null);

  const [enhancingPrompt, setEnhancingPrompt] = useState<PromptItem | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const [formData, setFormData] = usePersistedState<Partial<PromptItem>>('gsa_prompt_form_draft', DEFAULT_PROMPT_FORM);
  const [tagInput, setTagInput] = usePersistedState('gsa_prompt_tag_draft', '');
  const [varInput, setVarInput] = usePersistedState('gsa_prompt_var_draft', '');
  const [docInput, setDocInput] = usePersistedState('gsa_prompt_doc_draft', '');

  const dynamicSections = Array.from(
    prompts.reduce((map, p) => {
      const trimmed = p.section?.trim();
      if (trimmed && !map.has(trimmed.toLowerCase())) {
        map.set(trimmed.toLowerCase(), trimmed);
      }
      return map;
    }, new Map<string, string>()).values()
  );

  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.promptText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSection =
      selectedSection === 'Todos' || p.section.trim().toLowerCase() === selectedSection.trim().toLowerCase();
    const matchesFav = !onlyFavorites || p.isFavorite;

    return matchesSearch && matchesSection && matchesFav;
  });

  const handleCopyPrompt = (prompt: PromptItem) => {
    navigator.clipboard.writeText(prompt.promptText);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);

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

  const openTester = (prompt: PromptItem) => {
    setTestingPrompt(prompt);
    setAiExecutionResult(null);
    setTestFilePreview(null);
    setTestFileName('');
    setTestFileMimeType('');
    setTestFileError(null);
    const initialVars: Record<string, string> = {};
    prompt.variables?.forEach((v) => {
      initialVars[v] = '';
    });
    setVariableValues(initialVars);
  };

  const loadTestFile = (file: File) => {
    setTestFileError(null);
    if (!ACCEPTED_TEST_FILE_TYPES.includes(file.type)) {
      setTestFileError('Formato não suportado. Anexe uma imagem (PNG/JPG), um PDF, um DOCX ou um XLSX.');
      return;
    }
    if (file.size > MAX_TEST_FILE_SIZE_BYTES) {
      setTestFileError(`Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O limite é 4MB.`);
      return;
    }

    setTestFileName(file.name);
    setTestFileMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => setTestFilePreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleTestFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadTestFile(file);
  };

  const handleTestFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingTestFile(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    loadTestFile(file);
  };

  const handleRemoveTestFile = () => {
    setTestFilePreview(null);
    setTestFileName('');
    setTestFileMimeType('');
    setTestFileError(null);
    if (testFileInputRef.current) testFileInputRef.current.value = '';
  };

  const closeTester = () => {
    setTestingPrompt(null);
    handleRemoveTestFile();
  };

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

      const reply = await GeminiApiService.sendChatMessage(
        finalPrompt,
        undefined,
        testFilePreview
          ? { dataUrl: testFilePreview, mimeType: testFileMimeType, fileName: testFileName }
          : undefined
      );
      setAiExecutionResult(reply);

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

  const handleAddDoc = () => {
    const raw = docInput.trim();
    if (!raw) return;
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    if (!formData.sharedDocs?.includes(url)) {
      setFormData({ ...formData, sharedDocs: [...(formData.sharedDocs || []), url] });
    }
    setDocInput('');
  };

  const getDocLabel = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const loadDocUpload = (file: File) => {
    setDocUploadError(null);
    if (!ACCEPTED_TEST_FILE_TYPES.includes(file.type)) {
      setDocUploadError('Formato não suportado. Envie uma imagem (PNG/JPG), um PDF, um DOCX ou um XLSX.');
      return;
    }
    if (file.size > MAX_DOC_FILE_SIZE_BYTES) {
      setDocUploadError(`Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O limite é 1GB.`);
      return;
    }

    setIsUploadingDoc(true);
    (async () => {
      try {
        const docId = crypto.randomUUID();
        const filePath = await SupabaseStorageService.uploadPromptDocFile(file, docId);
        await onSavePromptDoc({
          id: docId,
          name: file.name,
          filePath,
          fileType: file.type,
          fileSize: file.size,
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        setDocUploadError(err.message || 'Não foi possível enviar o documento.');
      } finally {
        setIsUploadingDoc(false);
      }
    })();
  };

  const handleDocUploadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadDocUpload(file);
    e.target.value = '';
  };

  const handleDocUploadDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingDocUpload(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    loadDocUpload(file);
  };

  const handleDeleteDoc = async (doc: PromptDoc) => {
    if (confirm(`Excluir "${doc.name}" da biblioteca de documentos?`)) {
      await onDeletePromptDoc(doc.id);
      if (doc.filePath) {
        SupabaseStorageService.deletePromptDocFile(doc.filePath).catch(() => {});
      }
    }
  };

  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.promptText?.trim()) return;

    const newPrompt: PromptItem = {
      id: formData.id || crypto.randomUUID(),
      title: formData.title || 'Novo Prompt',
      promptText: formData.promptText || '',
      section: formData.section || 'Estudos',
      tags: formData.tags || [],
      variables: formData.variables || [],
      sharedDocs: formData.sharedDocs || [],
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
    setFormData(DEFAULT_PROMPT_FORM);
    setTagInput('');
    setVarInput('');
    setDocInput('');
  };

  const toggleExportSelection = (id: string) => {
    setSelectedExportIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmExport = () => {
    const toExport = prompts.filter((p) => selectedExportIds.has(p.id));
    exportPromptsAsPdf(toExport);
    setIsExportSelectOpen(false);
  };

  useEffect(() => {
    if (!isExportMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExportMenuOpen]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pt-15">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#FBBC04]" />
            <span className="sm:hidden">Prompts</span>
            <span className="hidden sm:inline">Banco de Prompts</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen((v) => !v)}
              disabled={prompts.length === 0}
              aria-haspopup="menu"
              aria-expanded={isExportMenuOpen}
              aria-label="Exportar prompts"
              className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Exportar prompts do banco"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-white border border-gray-200 shadow-lg p-1.5 z-20"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setSelectedExportIds(new Set(prompts.map((p) => p.id)));
                    setIsExportMenuOpen(false);
                    setIsExportSelectOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 text-[#EA4335]" />
                  <span>.pdf</span>
                </button>
              </div>
            )}
          </div>

          <button
            id="btn-docs-library"
            onClick={() => {
              setDocUploadError(null);
              setIsDocsLibraryOpen(true);
            }}
            aria-label="Documentos para teste"
            title="Documentos para teste"
            className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95"
          >
            <Paperclip className="w-4 h-4" />
            <span className="hidden sm:inline">Docs</span>
            {promptDocs.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-[#34A853]/15 text-[#2E7D32] text-[10px] font-bold">
                {promptDocs.length}
              </span>
            )}
          </button>

          <button
            id="btn-new-prompt"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            aria-label="Novo prompt"
            title="Novo prompt"
            className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo prompt</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-prompts-input"
              type="text"
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

          <div className="flex items-center gap-2">
            <button
              id="filter-favorites-prompts"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              aria-pressed={onlyFavorites}
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
        </div>

        {dynamicSections.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {['Todos', ...dynamicSections].map((sec) => {
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
        )}
      </div>

      {filteredPrompts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FBBC04]/15 text-[#B06000] flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum prompt encontrado</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              id={`prompt-card-${prompt.id}`}
              className="bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#FBBC04]/60 transition-all p-6 flex flex-col justify-between space-y-4"
            >
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

                <div className="relative group bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-700 font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">
                    {prompt.promptText}
                  </p>
                </div>

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

                  {prompt.sharedDocs && prompt.sharedDocs.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#34A853]/10 text-[#2E7D32]">
                      <Link2 className="w-3 h-3" />
                      {prompt.sharedDocs.length} doc{prompt.sharedDocs.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openTester(prompt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A73E8]/10 hover:bg-[#1A73E8]/20 text-[#1A73E8] text-xs font-bold transition-all active:scale-95"
                    aria-label="Testar prompt com Gemini"
                    title="Testar prompt com Gemini"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#1A73E8]" />
                    <span>Testar</span>
                  </button>

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

      {isAddModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBBC04]/20 text-[#8F5200] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Cadastrar Prompt
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
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Título do Prompt *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#FBBC04]/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    list="prompt-section-suggestions"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#FBBC04]/40"
                  />
                  {dynamicSections.length > 0 && (
                    <datalist id="prompt-section-suggestions">
                      {dynamicSections.map((sec) => (
                        <option key={sec} value={sec} />
                      ))}
                    </datalist>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Modelo Recomendado
                  </label>
                  <div className="relative">
                    <select
                      value={formData.recommendedModel}
                      onChange={(e) => setFormData({ ...formData, recommendedModel: e.target.value as any })}
                      className="appearance-none w-full px-3.5 py-2.5 pr-8 rounded-xl text-sm border border-gray-200 bg-gray-50 cursor-pointer"
                    >
                      <option value="gemini-3.7-flash">Gemini 3.7 Flash (Rápido & Inteligente)</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Raciocínio Profundo)</option>
                      <option value="gemini-3.1-flash-lite">Gemini Flash Lite (Super Leve)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Texto do Prompt *
                </label>
                <textarea
                  rows={6}
                  required
                  value={formData.promptText}
                  onChange={(e) => setFormData({ ...formData, promptText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#FBBC04]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Parâmetros do Prompt
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
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
                    aria-label="Adicionar variável"
                    title="Adicionar variável"
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold"
                  >
                    +
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

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Tags de Busca
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
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
                    aria-label="Adicionar tag"
                    title="Adicionar tag"
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold"
                  >
                    +
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

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Documentos Compartilhados
                </label>
                <p className="text-[11px] text-gray-500 mb-1.5">
                  Cole links de Google Docs, Sheets ou Slides para consultar enquanto testa este prompt.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://docs.google.com/document/d/..."
                    value={docInput}
                    onChange={(e) => setDocInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDoc();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddDoc}
                    aria-label="Adicionar documento compartilhado"
                    title="Adicionar documento compartilhado"
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold"
                  >
                    +
                  </button>
                </div>
                {formData.sharedDocs && formData.sharedDocs.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    {formData.sharedDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        <Link2 className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                        <span className="flex-1 min-w-0 truncate">{doc}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, sharedDocs: formData.sharedDocs?.filter((d) => d !== doc) })
                          }
                          className="hover:text-[#EA4335] shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                  disabled={!formData.title?.trim() || !formData.promptText?.trim()}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#FBBC04] hover:bg-[#F59E0B] text-gray-950 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#FBBC04]"
                >
                  Salvar
                </button>
              </div>

            </form>

            </div>
          </div>
        </div>
      )}

      {testingPrompt && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center">
                  <Play className="w-5 h-5 fill-[#1A73E8]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Testar Prompt
                  </h3>
                  <p className="text-xs text-gray-500">
                    {testingPrompt.title} • {testingPrompt.section}
                  </p>
                </div>
              </div>
              <button
                onClick={closeTester}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {testingPrompt.sharedDocs && testingPrompt.sharedDocs.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#1A73E8]/5 border border-[#1A73E8]/20 space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Documentos de Apoio
                </h4>
                <div className="flex flex-col gap-1.5">
                  {testingPrompt.sharedDocs.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-[#1A73E8]/50 text-xs font-semibold text-[#1A73E8] transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 min-w-0 truncate">{getDocLabel(doc)}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

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

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Prompt
              </label>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {testingPrompt.promptText}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Anexar (opcional)
              </label>
              <input
                ref={testFileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.docx,.xlsx,image/png,image/jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleTestFileChange}
              />
              {testFilePreview ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200">
                  {testFileMimeType.startsWith('image/') ? (
                    <img
                      src={testFilePreview}
                      alt="Anexo"
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-[#EA4335]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{testFileName}</p>
                    <p className="text-[11px] text-green-600 font-medium">Anexo pronto para o teste</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveTestFile}
                    aria-label="Remover anexo"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => testFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingTestFile(true);
                  }}
                  onDragLeave={() => setIsDraggingTestFile(false)}
                  onDrop={handleTestFileDrop}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-2xl border-2 border-dashed bg-[#F8FAFD] text-left transition-all ${
                    isDraggingTestFile ? 'border-[#1A73E8] bg-[#1A73E8]/5' : 'border-gray-300 hover:border-[#1A73E8]'
                  }`}
                >
                  <Paperclip className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-xs text-gray-600">
                    Anexe imagem (PNG/JPG) ou um documento (PDF/DOCX/XLSX) se a IA precisar de contexto.
                  </span>
                </button>
              )}
              {testFileError && (
                <p role="alert" className="mt-2 text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5">
                  {testFileError}
                </p>
              )}
            </div>

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

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeTester}
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
                    <span>Executar</span>
                  </>
                )}
              </button>
            </div>

            </div>
          </div>
        </div>
      )}

      {enhancingPrompt && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">

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
        </div>
      )}

      {isExportSelectOpen && (
        <div role="dialog" aria-modal="true" aria-label="Selecionar prompts para exportar" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBBC04]/20 text-[#8F5200] flex items-center justify-center">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Exportar Prompts</h3>
                  <p className="text-xs text-gray-500">Escolha o que deve ser exportado</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportSelectOpen(false)}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                {selectedExportIds.size} de {prompts.length} selecionado{prompts.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelectedExportIds(
                    selectedExportIds.size === prompts.length ? new Set() : new Set(prompts.map((p) => p.id))
                  )
                }
                className="text-xs font-bold text-[#1A73E8] hover:underline"
              >
                {selectedExportIds.size === prompts.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
              {prompts.map((prompt) => (
                <label
                  key={prompt.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedExportIds.has(prompt.id)}
                    onChange={() => toggleExportSelection(prompt.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1A73E8] focus:ring-[#1A73E8]/30 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{prompt.title}</p>
                    <p className="text-xs text-gray-500 truncate">{prompt.section}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="p-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsExportSelectOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmExport}
                disabled={selectedExportIds.size === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#FBBC04] hover:bg-[#F59E0B] text-gray-950 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className="w-4 h-4" />
                <span>Exportar {selectedExportIds.size > 0 ? `(${selectedExportIds.size})` : ''}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isDocsLibraryOpen && (
        <div role="dialog" aria-modal="true" aria-label="Documentos para teste" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#34A853]/15 text-[#2E7D32] flex items-center justify-center">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Documentos</h3>
                  <p className="text-xs text-gray-500">Envie arquivos de apoio para consultar enquanto testa seus prompts.</p>
                </div>
              </div>
              <button
                onClick={() => setIsDocsLibraryOpen(false)}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <input
                ref={docUploadInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.docx,.xlsx,image/png,image/jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleDocUploadInputChange}
              />
              <button
                type="button"
                onClick={() => docUploadInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingDocUpload(true);
                }}
                onDragLeave={() => setIsDraggingDocUpload(false)}
                onDrop={handleDocUploadDrop}
                disabled={isUploadingDoc}
                className={`w-full flex items-center gap-2.5 p-4 rounded-2xl border-2 border-dashed bg-[#F8FAFD] text-left transition-all disabled:opacity-60 ${
                  isDraggingDocUpload ? 'border-[#1A73E8] bg-[#1A73E8]/5' : 'border-gray-300 hover:border-[#1A73E8]'
                }`}
              >
                {isUploadingDoc ? (
                  <div className="w-5 h-5 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <Upload className="w-5 h-5 text-gray-500 shrink-0" />
                )}
                <span className="text-xs text-gray-600">
                  {isUploadingDoc
                    ? 'Enviando documento...'
                    : 'Clique ou arraste um arquivo'}
                </span>
              </button>
              {docUploadError && (
                <p role="alert" className="text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5">
                  {docUploadError}
                </p>
              )}

              {promptDocs.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">Nenhum documento enviado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {promptDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200"
                    >
                      {doc.fileType.startsWith('image/') ? (
                        <img
                          src={doc.fileData}
                          alt={doc.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-[#EA4335]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate">{doc.name}</p>
                        <p className="text-[11px] text-gray-500">{formatFileSize(doc.fileSize)}</p>
                      </div>
                      <a
                        href={doc.downloadUrl ?? doc.fileData}
                        download={doc.name}
                        aria-label={`Baixar ${doc.name}`}
                        title="Baixar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#1A73E8] hover:bg-[#1A73E8]/10 shrink-0"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc)}
                        aria-label={`Excluir ${doc.name}`}
                        title="Excluir"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 pt-4 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsDocsLibraryOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};