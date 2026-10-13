import confetti from 'canvas-confetti';
import { ChevronDown, Link2, Pencil, Sparkles, X } from 'lucide-react';
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useDismiss } from '../../hooks/useDismiss';
import type { PromptItem } from '../../types';
import { SelectDropdown } from '../SelectDropdown';
import type { PromptFormState } from './usePromptForm';

interface PromptFormModalProps {
  form: PromptFormState;
  sections: string[];
  onSavePrompt: (prompt: PromptItem) => Promise<void>;
}

function submitOnEnter(action: () => void) {
  return (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };
}

export function PromptFormModal({ form, sections, onSavePrompt }: PromptFormModalProps) {
  const { formData, setFormData, isEditMode, tagInput, setTagInput, varInput, setVarInput, docInput, setDocInput } =
    form;
  const [isSectionSuggestOpen, setIsSectionSuggestOpen] = useState(false);
  const sectionSuggestRef = useRef<HTMLDivElement>(null);
  useDismiss(sectionSuggestRef, isSectionSuggestOpen, () => setIsSectionSuggestOpen(false));

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (!formData.tags?.includes(tag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
    }
    setTagInput('');
  };

  const handleAddVar = () => {
    const v = varInput.trim().toUpperCase();
    if (!v) return;
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.promptText?.trim()) return;

    const prompt: PromptItem = {
      id: formData.id || crypto.randomUUID(),
      title: formData.title || 'Novo Prompt',
      promptText: formData.promptText || '',
      section: (formData.section || '').trim(),
      tags: formData.tags || [],
      variables: formData.variables || [],
      sharedDocs: formData.sharedDocs || [],
      recommendedModel: formData.recommendedModel || 'gemini-3.7-flash',
      isFavorite: formData.isFavorite || false,
      usageCount: formData.usageCount || 0,
      lastUsed: formData.lastUsed,
      createdAt: formData.createdAt || new Date().toISOString(),
    };

    await onSavePrompt(prompt);
    form.close();
    form.reset();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#FBBC04', '#1A73E8', '#34A853'],
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FBBC04]/20 text-[#8F5200] flex items-center justify-center">
                {isEditMode ? <Pencil className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {isEditMode ? 'Editar Prompt' : 'Cadastrar Prompt'}
                </h3>
                <p className="text-xs text-gray-500">
                  {isEditMode ? 'Atualize os dados do prompt.' : 'Salve prompts reutilizáveis.'}
                </p>
              </div>
            </div>
            <button
              onClick={form.close}
              aria-label="Fechar"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="prompt-form-title"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
              >
                Título do Prompt *
              </label>
              <input
                id="prompt-form-title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#FBBC04]/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="prompt-form-section"
                  className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
                >
                  Categoria
                </label>
                <div className="relative" ref={sectionSuggestRef}>
                  <input
                    id="prompt-form-section"
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#FBBC04]/40 ${sections.length > 0 ? 'pr-8' : ''}`}
                  />
                  {sections.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsSectionSuggestOpen((v) => !v)}
                      aria-label="Ver categorias já criadas"
                      aria-haspopup="listbox"
                      aria-expanded={isSectionSuggestOpen}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${isSectionSuggestOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                  {isSectionSuggestOpen && sections.length > 0 && (
                    <div
                      role="listbox"
                      className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-48 overflow-y-auto"
                    >
                      {sections.map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          role="option"
                          aria-selected={formData.section === sec}
                          onClick={() => {
                            setFormData({ ...formData, section: sec });
                            setIsSectionSuggestOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Modelo Recomendado
                </span>
                <SelectDropdown
                  value={formData.recommendedModel || ''}
                  onChange={(v) => setFormData({ ...formData, recommendedModel: v as PromptItem['recommendedModel'] })}
                  options={[
                    { value: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash (Rápido & Inteligente)' },
                    { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Raciocínio Profundo)' },
                    { value: 'gemini-3.1-flash-lite', label: 'Gemini Flash Lite (Super Leve)' },
                  ]}
                  ariaLabel="Modelo Recomendado"
                  align="center"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="prompt-form-text"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
              >
                Texto do Prompt *
              </label>
              <textarea
                id="prompt-form-text"
                rows={6}
                required
                value={formData.promptText}
                onChange={(e) => setFormData({ ...formData, promptText: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#FBBC04]/40"
              />
            </div>

            <div>
              <label
                htmlFor="prompt-form-var"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
              >
                Parâmetros do Prompt
              </label>
              <div className="flex gap-2">
                <input
                  id="prompt-form-var"
                  type="text"
                  value={varInput}
                  onChange={(e) => setVarInput(e.target.value)}
                  onKeyDown={submitOnEnter(handleAddVar)}
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
                  {formData.variables.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1A73E8]/10 text-[#1A73E8]"
                    >
                      [{v}]
                      <button
                        type="button"
                        aria-label={`Remover variável ${v}`}
                        onClick={() =>
                          setFormData({ ...formData, variables: formData.variables?.filter((x) => x !== v) })
                        }
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
              <label
                htmlFor="prompt-form-tag"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
              >
                Tags de Busca
              </label>
              <div className="flex gap-2">
                <input
                  id="prompt-form-tag"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={submitOnEnter(handleAddTag)}
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
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      #{tag}
                      <button
                        type="button"
                        aria-label={`Remover tag ${tag}`}
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
              <label
                htmlFor="prompt-form-doc"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
              >
                Documentos Compartilhados
              </label>
              <p className="text-[11px] text-gray-500 mb-1.5">
                Cole links de Google Docs, Sheets ou Slides para consultar enquanto testa este prompt.
              </p>
              <div className="flex gap-2">
                <input
                  id="prompt-form-doc"
                  type="url"
                  inputMode="url"
                  placeholder="https://docs.google.com/document/d/..."
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  onKeyDown={submitOnEnter(handleAddDoc)}
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
                  {formData.sharedDocs.map((doc) => (
                    <div
                      key={doc}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      <Link2 className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                      <span className="flex-1 min-w-0 truncate">{doc}</span>
                      <button
                        type="button"
                        aria-label={`Remover documento ${doc}`}
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
                onClick={form.close}
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
  );
}
