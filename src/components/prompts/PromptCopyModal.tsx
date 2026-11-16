import { Copy, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { PromptItem } from '../../types';
import { fillPromptVariables, getPromptVariables } from './fillPromptVariables';

interface PromptCopyModalProps {
  prompt: PromptItem;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export function PromptCopyModal({ prompt, onClose, onCopy }: PromptCopyModalProps) {
  const variables = getPromptVariables(prompt);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(variables.map((v) => [v, ''])));
  const preview = fillPromptVariables(prompt.promptText, values);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  useFocusTrap(dialogRef, onClose);
  useEffect(() => firstInputRef.current?.focus(), []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onCopy(preview);
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-copy-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col"
      >
        <div className="overflow-y-auto p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h3 id="prompt-copy-title" className="text-lg sm:text-xl font-bold text-gray-900">
                  Preencher e copiar
                </h3>
                <p className="text-xs text-gray-500">{prompt.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {variables.map((v, i) => (
              <div key={v}>
                <label htmlFor={`copy-var-${v}`} className="block text-[11px] font-bold text-gray-600 mb-1">
                  [{v}]
                </label>
                <input
                  id={`copy-var-${v}`}
                  type="text"
                  ref={i === 0 ? firstInputRef : undefined}
                  placeholder={`Valor para ${v}...`}
                  value={values[v] ?? ''}
                  onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-gray-300 bg-white focus:ring-2 focus:ring-[#1A73E8]/30 focus:border-[#1A73E8]"
                />
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Prévia</h4>
            <p
              aria-label="Prévia do prompt"
              className="max-h-56 overflow-y-auto bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs sm:text-sm text-gray-700 font-mono whitespace-pre-wrap leading-relaxed"
            >
              {preview}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onCopy(prompt.promptText)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Copiar original
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar preenchido</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
