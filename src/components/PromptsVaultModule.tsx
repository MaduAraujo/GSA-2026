import { ChevronDown, FileDown, FileText, Paperclip, Plus, Search, Sparkles, Star, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useDismiss } from '../hooks/useDismiss';
import type { PromptDoc, PromptItem } from '../types';
import { PromptCard } from './prompts/PromptCard';
import { PromptDocsLibraryModal } from './prompts/PromptDocsLibraryModal';
import { PromptEnhanceModal } from './prompts/PromptEnhanceModal';
import { PromptExportModal } from './prompts/PromptExportModal';
import { PromptFormModal } from './prompts/PromptFormModal';
import { PromptTesterModal } from './prompts/PromptTesterModal';
import { usePromptForm } from './prompts/usePromptForm';

interface PromptsVaultModuleProps {
  prompts: PromptItem[];
  onSavePrompt: (prompt: PromptItem) => Promise<void>;
  onDeletePrompt: (id: string) => Promise<void>;
  promptDocs: PromptDoc[];
  onSavePromptDoc: (doc: PromptDoc) => Promise<void>;
  onDeletePromptDoc: (id: string) => Promise<void>;
}

function getSections(prompts: PromptItem[]): string[] {
  const byKey = new Map<string, string>();
  for (const p of prompts) {
    const trimmed = p.section?.trim();
    if (trimmed && !byKey.has(trimmed.toLowerCase())) byKey.set(trimmed.toLowerCase(), trimmed);
  }
  return Array.from(byKey.values());
}

export function PromptsVaultModule({
  prompts,
  onSavePrompt,
  onDeletePrompt,
  promptDocs,
  onSavePromptDoc,
  onDeletePromptDoc,
}: PromptsVaultModuleProps) {
  const [selectedSection, setSelectedSection] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  useDismiss(exportMenuRef, isExportMenuOpen, () => setIsExportMenuOpen(false));

  const [isExportSelectOpen, setIsExportSelectOpen] = useState(false);
  const [isDocsLibraryOpen, setIsDocsLibraryOpen] = useState(false);
  const [testingPrompt, setTestingPrompt] = useState<PromptItem | null>(null);
  const [enhancingPrompt, setEnhancingPrompt] = useState<PromptItem | null>(null);
  const form = usePromptForm();

  const sections = getSections(prompts);
  const query = searchQuery.toLowerCase();

  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(query) ||
      p.promptText.toLowerCase().includes(query) ||
      p.tags.some((t) => t.toLowerCase().includes(query));
    const matchesSection =
      selectedSection === 'Todos' || p.section.trim().toLowerCase() === selectedSection.trim().toLowerCase();
    const matchesFav = !onlyFavorites || p.isFavorite;
    return matchesSearch && matchesSection && matchesFav;
  });

  const handleCopyPrompt = (prompt: PromptItem) => {
    navigator.clipboard.writeText(prompt.promptText);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
    void onSavePrompt({ ...prompt, usageCount: (prompt.usageCount || 0) + 1, lastUsed: new Date().toISOString() });
  };

  const handleDeletePrompt = async (prompt: PromptItem) => {
    if (confirm('Deseja excluir este prompt?')) {
      await onDeletePrompt(prompt.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pt-15">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#FBBC04]" />
            <span>Prompts</span>
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
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isExportMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-white border border-gray-200 shadow-lg p-1.5 z-20"
              >
                <button
                  role="menuitem"
                  onClick={() => {
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
            onClick={() => setIsDocsLibraryOpen(true)}
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
            onClick={form.openCreate}
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
              aria-label="Buscar prompts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-[#FBBC04]/40 focus:border-[#FBBC04] bg-gray-50"
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

        {sections.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {['Todos', ...sections].map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                aria-pressed={selectedSection === sec}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedSection === sec
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                }`}
              >
                {sec}
              </button>
            ))}
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
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              isCopied={copiedId === prompt.id}
              onToggleFavorite={() => onSavePrompt({ ...prompt, isFavorite: !prompt.isFavorite })}
              onTest={() => setTestingPrompt(prompt)}
              onEnhance={() => setEnhancingPrompt(prompt)}
              onEdit={() => form.openEdit(prompt)}
              onDelete={() => handleDeletePrompt(prompt)}
              onCopy={() => handleCopyPrompt(prompt)}
            />
          ))}
        </div>
      )}

      {form.isOpen && <PromptFormModal form={form} sections={sections} onSavePrompt={onSavePrompt} />}

      {testingPrompt && (
        <PromptTesterModal prompt={testingPrompt} onClose={() => setTestingPrompt(null)} onSavePrompt={onSavePrompt} />
      )}

      {enhancingPrompt && <PromptEnhanceModal prompt={enhancingPrompt} onClose={() => setEnhancingPrompt(null)} />}

      {isExportSelectOpen && <PromptExportModal prompts={prompts} onClose={() => setIsExportSelectOpen(false)} />}

      {isDocsLibraryOpen && (
        <PromptDocsLibraryModal
          promptDocs={promptDocs}
          onSavePromptDoc={onSavePromptDoc}
          onDeletePromptDoc={onDeletePromptDoc}
          onClose={() => setIsDocsLibraryOpen(false)}
        />
      )}
    </div>
  );
}
