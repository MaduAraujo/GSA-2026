import confetti from 'canvas-confetti';
import { ChevronDown, Link2, Pencil, Plus, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useToast } from '../../app/ToastProvider';
import { useDismiss } from '../../hooks/useDismiss';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { MAX_PROMPT_CHARS } from '../../shared/aiSchemas';
import type { PromptItem } from '../../types';
import { SelectDropdown } from '../SelectDropdown';
import { getPromptVariables } from './fillPromptVariables';
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

const normalizeTag = (raw: string) => raw.trim();
const normalizeVar = (raw: string) => raw.trim().toUpperCase();
function normalizeDoc(raw: string) {
  const value = raw.trim();
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function withEntry(list: string[] | undefined, entry: string): string[] {
  const current = list ?? [];
  return entry && !current.includes(entry) ? [...current, entry] : current;
}

export function PromptFormModal({ form, sections, onSavePrompt }: PromptFormModalProps) {
  const { formData, setFormData, isEditMode, tagInput, setTagInput, varInput, setVarInput, docInput, setDocInput } =
    form;
  const toast = useToast();
  const [isSectionSuggestOpen, setIsSectionSuggestOpen] = useState(false);
  const sectionSuggestRef = useRef<HTMLDivElement>(null);
  useDismiss(sectionSuggestRef, isSectionSuggestOpen, () => setIsSectionSuggestOpen(false));
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [showDraftNotice, setShowDraftNotice] = useState(!isEditMode && form.hasCreateDraft);

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const requestClose = () => {
    if (isEditMode && form.isDirty) setIsConfirmingDiscard(true);
    else form.close();
  };
  useFocusTrap(dialogRef, requestClose);
  useEffect(() => titleRef.current?.focus(), []);

  const promptText = formData.promptText ?? '';
  const declaredVars = formData.variables ?? [];
  const detectedVars = getPromptVariables({ promptText, variables: [] }).filter(
    (v) => !declaredVars.some((d) => d.toUpperCase() === v),
  );
  const hasVariables = declaredVars.length > 0 || detectedVars.length > 0;

  const insertVariable = (name: string) => {
    const token = `[${name}]`;
    const el = textRef.current;
    const start = el?.selectionStart ?? promptText.length;
    const end = el?.selectionEnd ?? promptText.length;
    setFormData({ ...formData, promptText: promptText.slice(0, start) + token + promptText.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const handleAddTag = () => {
    setFormData({ ...formData, tags: withEntry(formData.tags, normalizeTag(tagInput)) });
    setTagInput('');
  };

  const handleAddVar = () => {
    setFormData({ ...formData, variables: withEntry(formData.variables, normalizeVar(varInput)) });
    setVarInput('');
  };

  const handleAddDoc = () => {
    setFormData({ ...formData, sharedDocs: withEntry(formData.sharedDocs, normalizeDoc(docInput)) });
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
      tags: withEntry(formData.tags, normalizeTag(tagInput)),
      variables: withEntry(formData.variables, normalizeVar(varInput)),
      sharedDocs: withEntry(formData.sharedDocs, normalizeDoc(docInput)),
      recommendedModel: formData.recommendedModel || 'gemini-3.7-flash',
      isFavorite: formData.isFavorite || false,
      usageCount: formData.usageCount || 0,
      lastUsed: formData.lastUsed,
      createdAt: formData.createdAt || new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSavePrompt(prompt);
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível salvar o prompt. Tente novamente.', tone: 'error' });
      return;
    } finally {
      setIsSaving(false);
    }
    form.finishSave();

    if (isEditMode) {
      toast.show({ message: 'Prompt atualizado', tone: 'success' });
    } else {
      toast.show({ message: 'Prompt criado', tone: 'success' });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FBBC04', '#1A73E8', '#34A853'],
      });
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-form-heading"
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
                <h3 id="prompt-form-heading" className="text-lg sm:text-xl font-bold text-gray-900">
                  {isEditMode ? 'Editar Prompt' : 'Cadastrar Prompt'}
                </h3>
                <p className="text-xs text-gray-500">
                  {isEditMode ? 'Atualize os dados do prompt.' : 'Salve prompts reutilizáveis.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Fechar"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {showDraftNotice && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#1A73E8]/5 border border-[#1A73E8]/20 text-xs text-gray-700"
            >
              <span>Continuando o rascunho que você não salvou.</span>
              <button
                type="button"
                onClick={() => {
                  form.reset();
                  setShowDraftNotice(false);
                  titleRef.current?.focus();
                }}
                className="shrink-0 font-semibold text-[#1A73E8] hover:underline"
              >
                Descartar rascunho
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="prompt-form-title"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
              >
                Título do Prompt *
              </label>
              <input
                ref={titleRef}
                id="prompt-form-title"
                type="text"
                required
                placeholder="Ex.: Plano de estudos semanal"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/30 focus:border-[#1A73E8]"
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
                    placeholder="Ex.: Estudos"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/30 focus:border-[#1A73E8] ${sections.length > 0 ? 'pr-8' : ''}`}
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
                  Modelo recomendado
                </span>
                <SelectDropdown
                  value={formData.recommendedModel || 'gemini-3.7-flash'}
                  onChange={(v) => setFormData({ ...formData, recommendedModel: v as PromptItem['recommendedModel'] })}
                  options={[
                    { value: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash (Rápido & Inteligente)' },
                    { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Raciocínio Profundo)' },
                    { value: 'gemini-3.1-flash-lite', label: 'Gemini Flash Lite (Super Leve)' },
                  ]}
                  ariaLabel="Modelo recomendado"
                  align="left"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Onde este prompt funciona melhor. O teste aqui no Hub usa o modelo de IA do próprio Hub.
                </p>
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
                ref={textRef}
                id="prompt-form-text"
                rows={6}
                required
                maxLength={MAX_PROMPT_CHARS}
                aria-describedby="prompt-form-text-help"
                placeholder="Ex.: Crie um plano de estudos de 7 dias sobre [TEMA] para quem está no nível [NÍVEL]."
                value={formData.promptText}
                onChange={(e) => setFormData({ ...formData, promptText: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#1A73E8]/30"
              />
              <div
                id="prompt-form-text-help"
                className="mt-1 flex items-start justify-between gap-3 text-[11px] text-gray-500"
              >
                <span>
                  Use <span className="font-mono">[NOME]</span> em maiúsculas para criar variáveis, preenchidas na hora
                  de usar.
                </span>
                <span
                  className={`shrink-0 tabular-nums ${promptText.length > MAX_PROMPT_CHARS * 0.9 ? 'text-[#D93025] font-semibold' : ''}`}
                >
                  {promptText.length.toLocaleString('pt-BR')}/{MAX_PROMPT_CHARS.toLocaleString('pt-BR')}
                </span>
              </div>
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
                  placeholder="Ex.: TEMA"
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
              {hasVariables && (
                <p className="mt-2 text-[11px] text-gray-500">Clique numa variável para inseri-la no texto.</p>
              )}
              {hasVariables && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {declaredVars.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 pl-1 pr-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#1A73E8]/10 text-[#1A73E8]"
                    >
                      <button
                        type="button"
                        onClick={() => insertVariable(v)}
                        aria-label={`Inserir [${v}] no texto`}
                        className="px-1.5 py-0.5 rounded-md hover:bg-[#1A73E8]/15"
                      >
                        [{v}]
                      </button>
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
                  {detectedVars.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFormData({ ...formData, variables: withEntry(formData.variables, v) })}
                      aria-label={`Adicionar variável detectada ${v}`}
                      title="Encontrada no texto. Clique para adicionar."
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-dashed border-[#1A73E8]/50 text-[#1A73E8] hover:bg-[#1A73E8]/5"
                    >
                      <Plus className="w-3 h-3" />[{v}]
                    </button>
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
                  placeholder="Ex.: carreira"
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
                  type="text"
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

            {isConfirmingDiscard ? (
              <div
                role="alertdialog"
                aria-label="Descartar alterações"
                className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <p className="text-sm font-semibold text-gray-800">Descartar as alterações não salvas?</p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDiscard(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Continuar editando
                  </button>
                  <button
                    type="button"
                    onClick={form.discard}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[#D93025] hover:bg-[#B3261E] text-white"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={requestClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  {isEditMode ? 'Cancelar' : 'Fechar'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !formData.title?.trim() || !formData.promptText?.trim()}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1A73E8] hover:bg-[#1557B0] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1A73E8]"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
