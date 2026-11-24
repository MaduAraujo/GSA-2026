import React, { useEffect, useState } from 'react';
import { useUndoableDelete } from '../hooks/useUndoableDelete';
import { useToast } from '../app/ToastProvider';
import { ActionMenu } from './ActionMenu';
import { buttonClasses } from './ui/buttonClasses';
import { EmptyState, NoResults } from './ui/EmptyState';
import { SearchField } from './ui/SearchField';
import { useUrlState } from '../hooks/useUrlState';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Modal, ModalHeader } from './ui/Modal';
import { Link2, Plus, Trash2, Pencil, Loader2, StickyNote, ExternalLink, User } from 'lucide-react';
import { type ReferenceLink } from '../types';
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
  referenceLinks: allReferenceLinks,
  onSaveReferenceLink,
  onDeleteReferenceLink,
}) => {
  const toast = useToast();
  const pendingDelete = useUndoableDelete<ReferenceLink>({
    commit: (x) => onDeleteReferenceLink(x.id),
    message: 'Link excluído.',
    errorMessage: 'Não foi possível excluir o link. Tente novamente.',
  });
  const referenceLinks = allReferenceLinks.filter((x) => !pendingDelete.pendingIds.has(x.id));
  const [isFormOpen, setIsFormOpen] = usePersistedState('gsa_reference_link_modal_open', false);
  const [formData, setFormData] = usePersistedState<Partial<ReferenceLink>>(
    'gsa_reference_link_form_draft',
    DEFAULT_FORM,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useUrlState('q');
  const query = searchQuery.trim().toLowerCase();
  const sortedLinks = [...referenceLinks].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const filteredLinks = query
    ? sortedLinks.filter((link) =>
        [link.title, link.url, link.sharedBy, link.notes].some((field) => field?.toLowerCase().includes(query)),
      )
    : sortedLinks;

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
      toast.show({ message: 'Não foi possível salvar o link. Tente novamente.', tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (referenceLink: ReferenceLink) => pendingDelete.remove(referenceLink);

  useEffect(() => {
    if (!isFormOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFormOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFormOpen, setIsFormOpen]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Link2} iconClassName="text-primary" title="Referências">
        <Button
          id="btn-new-reference-link"
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          aria-label="Novo link de referência"
          title="Novo link de referência"
          variant="primary"
          collapseLabel
          icon={<Plus className="w-4 h-4" />}
        >
          Novo link
        </Button>
      </PageHeader>

      {sortedLinks.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            label="Buscar links"
            placeholder="Buscar por título, link, quem compartilhou ou anotação"
          />
        </div>
      )}

      {sortedLinks.length === 0 ? (
        <EmptyState
          icon={Link2}
          iconClassName="bg-primary/10 text-primary"
          title="Nenhum link registrado"
          description="Guarde referências de projetos e materiais para consultar depois."
          action={{
            label: 'Novo link',
            onClick: () => {
              resetForm();
              setIsFormOpen(true);
            },
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : filteredLinks.length === 0 ? (
        <NoResults
          title="Nenhum link encontrado"
          description="Nenhum link corresponde à busca."
          onClear={() => setSearchQuery('')}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs divide-y divide-gray-100">
          {filteredLinks.map((referenceLink) => (
            <div
              key={referenceLink.id}
              id={`reference-link-row-${referenceLink.id}`}
              className="flex items-center gap-4 p-5 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Link2 className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                {isHttpUrl(referenceLink.url) ? (
                  <a
                    href={referenceLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-w-full font-bold text-gray-900 leading-snug hover:text-primary hover:underline flex items-center gap-1.5"
                  >
                    <span className="truncate min-w-0 flex-1">{referenceLink.title}</span>
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

              <ActionMenu
                label={`Mais ações para ${referenceLink.title}`}
                items={[
                  { label: 'Editar', icon: Pencil, onSelect: () => handleEdit(referenceLink) },
                  { label: 'Excluir', icon: Trash2, tone: 'danger', onSelect: () => handleDelete(referenceLink) },
                ]}
              />
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <Modal onClose={() => setIsFormOpen(false)} labelledBy="reference-link-form-heading">
          <ModalHeader
            titleId="reference-link-form-heading"
            title={formData.id ? 'Editar Link' : 'Novo Link de Referência'}
            subtitle="Guarde referências de projetos para consultar depois"
            icon={Link2}
            iconClassName="bg-primary/10 text-primary"
            onClose={() => setIsFormOpen(false)}
          />
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="referencelinks-titulo" className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  id="referencelinks-titulo"
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>

              <div>
                <label htmlFor="referencelinks-link" className="block text-sm font-medium text-gray-700 mb-1">
                  Link *
                </label>
                <input
                  id="referencelinks-link"
                  type="url"
                  required
                  value={formData.url || ''}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>

              <div>
                <label
                  htmlFor="referencelinks-compartilhado-por"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Compartilhado por
                </label>
                <input
                  id="referencelinks-compartilhado-por"
                  type="text"
                  value={formData.sharedBy || ''}
                  onChange={(e) => setFormData({ ...formData, sharedBy: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>

              <div>
                <label htmlFor="referencelinks-observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  id="referencelinks-observacoes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/30 resize-none"
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-danger-600 bg-danger/10 border border-danger/20 rounded-xl px-3.5 py-2.5"
                >
                  {formError}
                </p>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSaving || !formData.title?.trim() || !formData.url?.trim()}
                  className={buttonClasses({ variant: 'primary' })}
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
