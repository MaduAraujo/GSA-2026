import { FileDown, X } from 'lucide-react';
import { useState } from 'react';
import type { PromptItem } from '../../types';
import { exportPromptsAsPdf } from '../../utils/promptsExport';

interface PromptExportModalProps {
  prompts: PromptItem[];
  onClose: () => void;
}

export function PromptExportModal({ prompts, onClose }: PromptExportModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(prompts.map((p) => p.id)));
  const allSelected = selectedIds.size === prompts.length;

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    exportPromptsAsPdf(prompts.filter((p) => selectedIds.has(p.id)));
    onClose();
  };

  return (
    <div
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
              <h3 className="text-lg font-bold text-gray-900">Exportar Prompts</h3>
              <p className="text-xs text-gray-500">Escolha o que deve ser exportado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">
            {selectedIds.size} de {prompts.length} selecionado{prompts.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => setSelectedIds(allSelected ? new Set() : new Set(prompts.map((p) => p.id)))}
            className="text-xs font-bold text-[#1A73E8] hover:underline"
          >
            {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
          {prompts.map((prompt) => (
            <label key={prompt.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.has(prompt.id)}
                onChange={() => toggle(prompt.id)}
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
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#FBBC04] hover:bg-[#F59E0B] text-gray-950 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
