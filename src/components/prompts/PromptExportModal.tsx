import { FileDown, Search, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { PromptItem } from '../../types';
import { exportPromptsAsPdf } from '../../utils/promptsExport';
import { matchesPromptSearch } from './promptSearch';

interface PromptExportModalProps {
  prompts: PromptItem[];
  initialSelectedIds?: string[];
  onClose: () => void;
}

export function PromptExportModal({ prompts, initialSelectedIds, onClose }: PromptExportModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onClose);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds ?? prompts.map((p) => p.id)),
  );
  const [query, setQuery] = useState('');
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
    exportPromptsAsPdf(prompts.filter((p) => selectedIds.has(p.id)));
    onClose();
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Selecionar prompts para exportar"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FBBC04]/20 text-[#8F5200] flex items-center justify-center">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Exportar em PDF</h3>
              <p className="text-xs text-gray-500">Escolha os prompts que entram no arquivo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-3 space-y-3 border-b border-gray-100 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Buscar prompts para exportar"
              placeholder="Buscar por título, texto ou #tag..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#1A73E8]/30 focus:border-[#1A73E8]"
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
              className="text-xs font-bold text-[#1A73E8] hover:underline disabled:opacity-50 disabled:no-underline"
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
              <label
                key={prompt.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(prompt.id)}
                  onChange={() => toggle(prompt.id)}
                  className="w-4 h-4 rounded border-gray-300 text-[#1A73E8] focus:ring-[#1A73E8]/30 shrink-0"
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
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1A73E8] hover:bg-[#1557B0] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
