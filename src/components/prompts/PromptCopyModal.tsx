import { Copy } from 'lucide-react';
import { buttonClasses } from '../ui/buttonClasses';
import { Modal, ModalHeader } from '../ui/Modal';
import { useEffect, useRef, useState, type FormEvent } from 'react';
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
  const firstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => firstInputRef.current?.focus(), []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onCopy(preview);
  };

  return (
    <Modal onClose={onClose} labelledBy="prompt-copy-title" size="2xl">
      <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
        <ModalHeader
          titleId="prompt-copy-title"
          title="Preencher e copiar"
          subtitle={prompt.title}
          icon={Copy}
          iconClassName="bg-gray-900 text-white"
          onClose={onClose}
        />
        <div className="overflow-y-auto p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {variables.map((v, i) => (
              <div key={v}>
                <label htmlFor={`copy-var-${v}`} className="block text-2xs font-bold text-gray-600 mb-1">
                  [{v}]
                </label>
                <input
                  id={`copy-var-${v}`}
                  type="text"
                  ref={i === 0 ? firstInputRef : undefined}
                  placeholder={`Valor para ${v}...`}
                  value={values[v] ?? ''}
                  onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-gray-300 bg-white focus-visible:ring-2 focus-visible:ring-primary/30 focus:border-primary"
                />
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Prévia</h4>
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
              className={buttonClasses({ variant: 'ghost' })}
            >
              Copiar original
            </button>
            <button type="submit" className={buttonClasses({ variant: 'primary' })}>
              <Copy className="w-4 h-4" />
              <span>Copiar preenchido</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
