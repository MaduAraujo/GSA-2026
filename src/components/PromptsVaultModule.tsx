import { ArrowUpDown, FileDown, Paperclip, Plus, Search, Sparkles, Star, X } from 'lucide-react';
import { EmptyState, NoResults } from './ui/EmptyState';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { buttonClasses } from './ui/buttonClasses';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useToast } from '../app/ToastProvider';
import { usePersistedState } from '../hooks/usePersistedState';
import { useUndoableDelete } from '../hooks/useUndoableDelete';
import type { PromptDoc, PromptItem } from '../types';
import { PromptCard } from './prompts/PromptCard';
import { PromptCopyModal } from './prompts/PromptCopyModal';
import { PromptDocsLibraryModal } from './prompts/PromptDocsLibraryModal';
import { PromptEnhanceModal } from './prompts/PromptEnhanceModal';
import { PromptExportModal } from './prompts/PromptExportModal';
import { PromptFormModal } from './prompts/PromptFormModal';
import { PromptTesterModal } from './prompts/PromptTesterModal';
import { getPromptVariables } from './prompts/fillPromptVariables';
import { matchesPromptSearch, PROMPT_SORT_LABELS, PROMPT_SORTERS, type PromptSortOption } from './prompts/promptSearch';
import { usePromptForm } from './prompts/usePromptForm';
import { SelectDropdown } from './SelectDropdown';

interface PromptsVaultModuleProps {
  prompts: PromptItem[];
  onSavePrompt: (prompt: PromptItem) => Promise<void>;
  onDeletePrompt: (id: string) => Promise<void>;
  promptDocs: PromptDoc[];
  onSavePromptDoc: (doc: PromptDoc) => Promise<void>;
  onDeletePromptDoc: (id: string) => Promise<void>;
}

const ALL_SECTIONS = 'Todos';

function getSections(prompts: PromptItem[]): string[] {
  const byKey = new Map<string, string>();
  for (const p of prompts) {
    const trimmed = p.section?.trim();
    if (trimmed && !byKey.has(trimmed.toLowerCase())) byKey.set(trimmed.toLowerCase(), trimmed);
  }
  return Array.from(byKey.values());
}

function usePromptFilters() {
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
  return {
    searchQuery: params.get('q') ?? '',
    selectedSection: params.get('secao') ?? ALL_SECTIONS,
    onlyFavorites: params.get('fav') === '1',
    setSearchQuery: (q: string) => update('q', q || null),
    setSelectedSection: (s: string) => update('secao', s === ALL_SECTIONS ? null : s),
    setOnlyFavorites: (on: boolean) => update('fav', on ? '1' : null),
    clear: () => setParams({}, { replace: true }),
  };
}

function useHasMoreToRight(ref: React.RefObject<HTMLElement | null>, deps: unknown[]) {
  const [hasMore, setHasMore] = useState(false);
  const check = () => {
    const el = ref.current;
    setHasMore(!!el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(check, deps);
  useEffect(() => {
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  });
  return [hasMore, check] as const;
}

export function PromptsVaultModule({
  prompts: savedPrompts,
  onSavePrompt,
  onDeletePrompt,
  promptDocs,
  onSavePromptDoc,
  onDeletePromptDoc,
}: PromptsVaultModuleProps) {
  const filters = usePromptFilters();
  const { searchQuery, selectedSection, onlyFavorites } = filters;
  const [storedSortBy, setSortBy] = usePersistedState<PromptSortOption>('gsa_prompt_sort_by', 'recent');
  const sortBy: PromptSortOption = storedSortBy in PROMPT_SORTERS ? storedSortBy : 'recent';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fillingPrompt, setFillingPrompt] = useState<PromptItem | null>(null);
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const toast = useToast();
  const pendingDelete = useUndoableDelete<PromptItem>({
    commit: (prompt) => onDeletePrompt(prompt.id),
    message: 'Prompt excluído',
    errorMessage: 'Não foi possível excluir o prompt. Ele foi restaurado.',
  });
  const prompts = savedPrompts
    .filter((p) => !pendingDelete.pendingIds.has(p.id))
    .map((p) => (p.id in favoriteOverrides ? { ...p, isFavorite: favoriteOverrides[p.id] } : p));

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDocsLibraryOpen, setIsDocsLibraryOpen] = useState(false);
  const [testingPrompt, setTestingPrompt] = useState<PromptItem | null>(null);
  const [enhancingPrompt, setEnhancingPrompt] = useState<PromptItem | null>(null);
  const form = usePromptForm();
  const searchRef = useRef<HTMLInputElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);

  const sections = getSections(prompts);
  const [sectionsHaveMore, checkSectionsScroll] = useHasMoreToRight(sectionsRef, [sections.join('|')]);

  const filteredPrompts = prompts
    .filter((p) => {
      const matchesSection =
        selectedSection === ALL_SECTIONS || p.section.trim().toLowerCase() === selectedSection.trim().toLowerCase();
      return matchesSection && (!onlyFavorites || p.isFavorite) && matchesPromptSearch(p, searchQuery);
    })
    .sort(PROMPT_SORTERS[sortBy]);

  const hasActiveFilters = searchQuery !== '' || selectedSection !== ALL_SECTIONS || onlyFavorites;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const copyText = async (prompt: PromptItem, text: string) => {
    setFillingPrompt(null);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.show({ message: 'Não foi possível copiar o prompt.', tone: 'error' });
      return;
    }
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
    void onSavePrompt({ ...prompt, usageCount: (prompt.usageCount || 0) + 1, lastUsed: new Date().toISOString() });
  };

  const handleCopyPrompt = (prompt: PromptItem) => {
    if (getPromptVariables(prompt).length) setFillingPrompt(prompt);
    else void copyText(prompt, prompt.promptText);
  };

  const toggleFavorite = async (prompt: PromptItem) => {
    const next = !prompt.isFavorite;
    setFavoriteOverrides((o) => ({ ...o, [prompt.id]: next }));
    try {
      await onSavePrompt({ ...prompt, isFavorite: next });
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível atualizar o favorito. Tente novamente.', tone: 'error' });
    } finally {
      setFavoriteOverrides(({ [prompt.id]: _, ...rest }) => rest);
    }
  };

  const duplicatePrompt = async (prompt: PromptItem) => {
    const copy: PromptItem = {
      ...prompt,
      id: crypto.randomUUID(),
      title: `${prompt.title} (cópia)`,
      isFavorite: false,
      usageCount: 0,
      lastUsed: undefined,
      createdAt: new Date().toISOString(),
    };
    try {
      await onSavePrompt(copy);
      toast.show({
        message: 'Prompt duplicado',
        tone: 'success',
        action: { label: 'Editar', onClick: () => form.openEdit(copy) },
      });
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível duplicar o prompt.', tone: 'error' });
    }
  };

  const secondaryButton = buttonClasses({ collapseLabel: true });

  return (
    <div className="space-y-6">
      <PageHeader icon={Sparkles} iconClassName="text-primary" title="Prompts">
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            disabled={prompts.length === 0}
            aria-label="Exportar prompts em PDF"
            title="Exportar prompts em PDF"
            className={secondaryButton}
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>

          <button
            id="btn-docs-library"
            type="button"
            onClick={() => setIsDocsLibraryOpen(true)}
            aria-label="Documentos para teste"
            title="Documentos para teste"
            className={secondaryButton}
          >
            <Paperclip className="w-4 h-4" />
            <span className="hidden sm:inline">Docs</span>
            {promptDocs.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-success/15 text-success-800 text-2xs font-bold">
                {promptDocs.length}
              </span>
            )}
          </button>

          <Button
            id="btn-new-prompt"
            onClick={form.openCreate}
            aria-label="Novo prompt"
            title={form.hasCreateDraft ? 'Continuar rascunho' : 'Novo prompt'}
            variant="primary"
            collapseLabel
            icon={<Plus className="w-4 h-4" />}
            className="relative"
          >
            {form.hasCreateDraft ? 'Continuar rascunho' : 'Novo prompt'}
          </Button>
        </div>
      </PageHeader>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchRef}
              id="search-prompts-input"
              type="text"
              aria-label="Buscar prompts"
              aria-keyshortcuts="/"
              placeholder="Buscar por título, texto, categoria ou #tag"
              value={searchQuery}
              onChange={(e) => filters.setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-xl text-sm border border-gray-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus:border-primary bg-gray-50"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => filters.setSearchQuery('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd
                aria-hidden="true"
                className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md border border-gray-200 bg-white text-2xs font-mono text-gray-500"
              >
                /
              </kbd>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="filter-favorites-prompts"
              type="button"
              onClick={() => filters.setOnlyFavorites(!onlyFavorites)}
              aria-pressed={onlyFavorites}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                onlyFavorites
                  ? 'bg-warning/20 border-warning text-warning-900'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-warning text-warning' : 'text-gray-500'}`} />
              <span>Favoritos</span>
            </button>

            <div className="relative w-46">
              <SelectDropdown
                value={sortBy}
                onChange={(v) => setSortBy(v as PromptSortOption)}
                options={(Object.keys(PROMPT_SORT_LABELS) as PromptSortOption[]).map((opt) => ({
                  value: opt,
                  label: <span className="whitespace-nowrap">{PROMPT_SORT_LABELS[opt]}</span>,
                }))}
                ariaLabel="Ordenar prompts"
                buttonClassName="w-full h-8.5 pl-7 pr-7 rounded-xl text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <ArrowUpDown
                aria-hidden="true"
                className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {sections.length > 0 && (
          <div className="relative">
            <div
              ref={sectionsRef}
              onScroll={checkSectionsScroll}
              role="group"
              aria-label="Filtrar por categoria"
              className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-reveal"
            >
              {[ALL_SECTIONS, ...sections].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => filters.setSelectedSection(sec)}
                  aria-pressed={selectedSection === sec}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedSection === sec
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200/80 hover:text-gray-900'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
            {sectionsHaveMore && (
              <div
                aria-hidden="true"
                data-testid="sections-fade"
                className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-white dark:from-surface-muted to-transparent"
              />
            )}
          </div>
        )}

        {prompts.length > 0 && (
          <p aria-live="polite" className="text-xs text-gray-600">
            {hasActiveFilters
              ? `${filteredPrompts.length} de ${prompts.length} prompts`
              : `${prompts.length} prompt${prompts.length === 1 ? '' : 's'}`}
          </p>
        )}
      </div>

      {prompts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          iconClassName="bg-primary/10 text-primary"
          title="Sua biblioteca de prompts está vazia"
          description={
            <>
              Guarde os prompts que você mais usa, com variáveis como <span className="font-mono">[TEMA]</span> para
              reaproveitar, testar e aprimorar com IA.
            </>
          }
          action={{
            label: form.hasCreateDraft ? 'Continuar rascunho' : 'Criar primeiro prompt',
            onClick: form.openCreate,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : filteredPrompts.length === 0 ? (
        <NoResults
          title="Nenhum prompt encontrado"
          description={
            searchQuery ? (
              <>
                Nenhum resultado para <span className="font-semibold">“{searchQuery}”</span> com os filtros atuais.
              </>
            ) : (
              'Nenhum prompt corresponde aos filtros selecionados.'
            )
          }
          onClear={hasActiveFilters ? filters.clear : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              isCopied={copiedId === prompt.id}
              onToggleFavorite={() => void toggleFavorite(prompt)}
              onTest={() => setTestingPrompt(prompt)}
              onEnhance={() => setEnhancingPrompt(prompt)}
              onEdit={() => form.openEdit(prompt)}
              onDuplicate={() => void duplicatePrompt(prompt)}
              onDelete={() => pendingDelete.remove(prompt)}
              onCopy={() => handleCopyPrompt(prompt)}
            />
          ))}
        </div>
      )}

      {form.isOpen && <PromptFormModal form={form} sections={sections} onSavePrompt={onSavePrompt} />}

      {fillingPrompt && (
        <PromptCopyModal
          prompt={fillingPrompt}
          onClose={() => setFillingPrompt(null)}
          onCopy={(text) => void copyText(fillingPrompt, text)}
        />
      )}

      {testingPrompt && (
        <PromptTesterModal
          prompt={testingPrompt}
          promptDocs={promptDocs}
          onClose={() => setTestingPrompt(null)}
          onSavePrompt={onSavePrompt}
        />
      )}

      {enhancingPrompt && (
        <PromptEnhanceModal
          prompt={enhancingPrompt}
          onClose={() => setEnhancingPrompt(null)}
          onSavePrompt={onSavePrompt}
        />
      )}

      {isExportOpen && (
        <PromptExportModal
          prompts={prompts}
          initialSelectedIds={filteredPrompts.map((p) => p.id)}
          onClose={() => setIsExportOpen(false)}
        />
      )}

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
