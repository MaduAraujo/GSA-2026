import { Copy, Wand2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AiApiService } from '../../services/aiApi';
import type { PromptItem } from '../../types';
import { errorMessage } from '../../utils/errors';

interface PromptEnhanceModalProps {
  prompt: PromptItem;
  onClose: () => void;
}

export function PromptEnhanceModal({ prompt, onClose }: PromptEnhanceModalProps) {
  const [result, setResult] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(true);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    AiApiService.enhancePrompt({
      prompt: prompt.promptText,
      section: prompt.section,
      objective: 'Melhorar precisão, formatação e resultados gerados no Gemini 3.7',
    })
      .then(setResult)
      .catch((err: unknown) => setResult(`Erro ao aprimorar prompt: ${errorMessage(err, 'tente novamente.')}`))
      .finally(() => setIsEnhancing(false));
  }, [prompt.promptText, prompt.section]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FBBC04]/20 text-[#8F5200] flex items-center justify-center">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Otimizador de Prompts com Gemini</h3>
                <p className="text-xs text-gray-500">Engenharia de prompts avançada para o programa Google 2026.</p>
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

          {isEnhancing ? (
            <div className="py-16 text-center space-y-4" role="status">
              <div className="w-12 h-12 border-3 border-[#FBBC04] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-gray-700">
                O Gemini está aprimorando a estrutura, persona e clareza do seu prompt...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                {result}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                    alert('Prompt aprimorado copiado com sucesso!');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#FBBC04] text-gray-950 text-xs font-bold hover:bg-[#F59E0B] flex items-center gap-1.5 shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Prompt Aprimorado</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
