import { FileDown, Search } from 'lucide-react';
import { buttonClasses } from '../ui/buttonClasses';
import { Modal, ModalHeader } from '../ui/Modal';
import { useState } from 'react';
import type { PromptItem } from '../../types';
import { exportPromptsAsPdf } from '../../utils/promptsExport';
import { POPUP_BLOCKED_MESSAGE } from '../../utils/popup';
import { useToast } from '../../app/ToastProvider';
import { matchesPromptSearch } from './promptSearch';

interface PromptExportModalProps {
  prompts: PromptItem[];
  initialSelectedIds?: string[];
  onClose: () => void;
}

export function PromptExportModal({ prompts, initialSelectedIds, onClose }: PromptExportModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds ?? prompts.map((p) => p.id)),
  );
  const [query, setQuery] = useState('');
  const toast = useToast();
  const visible = prompts.filter((p) => matchesPromptSearch(p, query));
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selectedIds.has(p.id));

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const p of visible) {
        if (allVisibleSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });

  const handleExport = () => {
    if (!exportPromptsAsPdf(prompts.filter((p) => selectedIds.has(p.id)))) {
      toast.show({ message: POPUP_BLOCKED_MESSAGE, tone: 'error' });
      return;
    }
    onClose();
  };

  return (
    <Modal labelledBy="prompt-export-heading" onClose={onClose} label="Selecionar prompts para exportar">
      <ModalHeader
        titleId="prompt-export-heading"
        title="Exportar em PDF"
        subtitle="Escolha os prompts que entram no arquivo"
        icon={FileDown}
        iconClassName="bg-primary/10 text-primary"
        onClose={onClose}
      />

      <div className="px-6 pt-3 space-y-3 border-b border-gray-100 pb-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Buscar prompts para exportar"
            placeholder="Buscar por título, texto ou #tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600">
            {selectedIds.size} de {prompts.length} selecionado{selectedIds.size === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={toggleAllVisible}
            disabled={visible.length === 0}
            className="text-xs font-bold text-primary hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {allVisibleSelected
              ? query
                ? 'Desmarcar resultados'
                : 'Desmarcar todos'
              : query
                ? 'Selecionar resultados'
                : 'Selecionar todos'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
        {visible.length === 0 ? (
          <p className="text-center text-xs text-gray-500 py-6">Nenhum prompt encontrado para “{query}”.</p>
        ) : (
          visible.map((prompt) => (
            <label key={prompt.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.has(prompt.id)}
                onChange={() => toggle(prompt.id)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus-visible:ring-primary/30 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{prompt.title}</p>
                {prompt.section.trim() && <p className="text-xs text-gray-500 truncate">{prompt.section}</p>}
              </div>
            </label>
          ))
        )}
      </div>

      <div className="p-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
        <button type="button" onClick={onClose} className={buttonClasses({ variant: 'ghost' })}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={selectedIds.size === 0}
          className={buttonClasses({ variant: 'primary' })}
        >
          <FileDown className="w-4 h-4" />
          <span>Exportar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
        </button>
      </div>
    </Modal>
  );
}
