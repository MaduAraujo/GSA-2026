import React from 'react';
import { Download, Smartphone, Monitor, Apple, CheckCircle2, X, Sparkles } from 'lucide-react';

interface PwaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstall: () => void;
}

export const PwaGuideModal: React.FC<PwaGuideModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden border border-gray-300 shadow-xl flex flex-col">
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Instalar Aplicativo (PWA)
              </h3>
              <p className="text-xs text-gray-600">
                Acesse seus certificados e prompts offline direto da tela inicial.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {deferredPrompt ? (
          <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-600/20 space-y-3 text-center">
            <Sparkles className="w-6 h-6 text-blue-600 mx-auto" />
            <p className="text-sm font-bold text-gray-900">
              Seu navegador suporta instalação instantânea em 1 clique!
            </p>
            <button
              onClick={() => {
                onInstall();
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Instalar Aplicativo Agora</span>
            </button>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-600/15 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-900">Android (Google Chrome)</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito do Chrome e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-800 flex items-center justify-center shrink-0 mt-0.5">
              <Apple className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-900">iPhone / iPad (Safari)</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Toque no botão <strong>Compartilhar (quadrado com seta para cima)</strong> na barra inferior do Safari e escolha <strong>"Adicionar à Tela de Início"</strong>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Monitor className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-900">Computador (Chrome / Edge / Brave)</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Clique no ícone de <strong>instalação de aplicativo</strong> na barra de endereços (ao lado da estrela de favoritos) ou vá em <strong>Menu &gt; Salvar e compartilhar &gt; Instalar página como app</strong>.
              </p>
            </div>
          </div>

        </div>

        <div className="pt-2 border-t border-gray-200 grid grid-cols-2 gap-2 text-[11px] text-gray-600 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
            <span>Funciona Offline</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1E8E3E]" />
            <span>Sem ocupar espaço</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1E8E3E]" />
            <span>Acesso instantâneo</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1E8E3E]" />
            <span>Design limpo e nativo</span>
          </span>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold"
          >
            Entendi
          </button>
        </div>

        </div>
      </div>
    </div>
  );
};