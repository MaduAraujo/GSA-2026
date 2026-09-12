import React, { useEffect, useState } from 'react';
import { Link2, Plus, X, Trash2, Pencil, Loader2, StickyNote, ExternalLink, User } from 'lucide-react';
import { ReferenceLink } from '../types';
import { usePersistedState } from '../hooks/usePersistedState';
import { isHttpUrl } from '../utils/safeUrl';

interface ReferenceLinksModuleProps {
  referenceLinks: ReferenceLink[];
  onSaveReferenceLink: (referenceLink: ReferenceLink) => Promise<void>;
  onDeleteReferenceLink: (id: string) => Promise<void>;
}

const DEFAULT_FORM: Partial<ReferenceLink> = {
  title: '',
  url: '',
  sharedBy: '',
  notes: '',
};

export const ReferenceLinksModule: React.FC<ReferenceLinksModuleProps> = ({
  referenceLinks,
  onSaveReferenceLink,
  onDeleteReferenceLink,
}) => {
  const [isFormOpen, setIsFormOpen] = usePersistedState('gsa_reference_link_modal_open', false);
  const [formData, setFormData] = usePersistedState<Partial<ReferenceLink>>('gsa_reference_link_form_draft', DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const sortedLinks = [...referenceLinks].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setFormError(null);
  };

  const handleEdit = (referenceLink: ReferenceLink) => {
    setFormData(referenceLink);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.url?.trim()) return;
    if (!isHttpUrl(formData.url.trim())) {
      setFormError('Informe um link válido (começando com http:// ou https://).');
      return;
    }

    setIsSaving(true);
    try {
      const referenceLink: ReferenceLink = {
        id: formData.id || crypto.randomUUID(),
        title: formData.title.trim(),
        url: formData.url.trim(),
        sharedBy: (formData.sharedBy || '').trim() || undefined,
        notes: (formData.notes || '').trim() || undefined,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveReferenceLink(referenceLink);
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Não foi possível salvar o link. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (referenceLink: ReferenceLink) => {
    if (!confirm('Deseja realmente remover este link de referência?')) return;
    setDeletingId(referenceLink.id);
    try {
      await onDeleteReferenceLink(referenceLink.id);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir o link. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!isFormOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFormOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFormOpen]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Link2 className="w-6 h-6 text-[#1A73E8]" />
            <span>Referências</span>
          </h2>
        </div>

        <button
          id="btn-new-reference-link"
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          aria-label="Novo link de referência"
          title="Novo link de referência"
          className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo link</span>
        </button>
      </div>

      {sortedLinks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center mx-auto">
            <Link2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum link registrado</h3>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs divide-y divide-gray-100">
          {sortedLinks.map((referenceLink) => (
            <div
              key={referenceLink.id}
              id={`reference-link-row-${referenceLink.id}`}
              className="flex items-center gap-4 p-5 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center shrink-0">
                <Link2 className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                {isHttpUrl(referenceLink.url) ? (
                  <a
                    href={referenceLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-gray-900 leading-snug hover:text-[#1A73E8] hover:underline inline-flex items-center gap-1.5"
                  >
                    <span className="truncate">{referenceLink.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <p className="font-bold text-gray-900 leading-snug truncate">{referenceLink.title}</p>
                )}

                {referenceLink.sharedBy && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Compartilhado por {referenceLink.sharedBy}</span>
                  </p>
                )}

                {referenceLink.notes && (
                  <p className="text-xs text-gray-500 flex items-start gap-1.5 mt-1">
                    <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{referenceLink.notes}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleEdit(referenceLink)}
                  aria-label="Editar link"
                  title="Editar"
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(referenceLink)}
                  disabled={deletingId === referenceLink.id}
                  aria-label="Excluir link"
                  title="Excluir"
                  className="p-2 rounded-xl text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 disabled:opacity-50"
                >
                  {deletingId === referenceLink.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {formData.id ? 'Editar Link' : 'Novo Link de Referência'}
                    </h3>
                    <p className="text-xs text-gray-500">Guarde projetos de outras pessoas para consultar depois</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  aria-label="Fechar"
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Portfólio da Ana"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#1A73E8]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.url || ''}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#1A73E8]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Compartilhado por (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.sharedBy || ''}
                    onChange={(e) => setFormData({ ...formData, sharedBy: e.target.value })}
                    placeholder="Ex: Ana Souza"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#1A73E8]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Ex: bom exemplo de post sobre certificações"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#1A73E8]/30 resize-none"
                  />
                </div>

                {formError && (
                  <p role="alert" className="text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5">
                    {formError}
                  </p>
                )}

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !formData.title?.trim() || !formData.url?.trim()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1A73E8] hover:bg-[#1765CC] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
