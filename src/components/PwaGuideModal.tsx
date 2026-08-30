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
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#DADCE0] shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8EAED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#202124]">
                Instalar Aplicativo (PWA)
              </h3>
              <p className="text-xs text-[#5F6368]">
                Acesse seus certificados e prompts offline direto da tela inicial.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-lg hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Install Button if prompt ready */}
        {deferredPrompt ? (
          <div className="p-4 rounded-xl bg-[#1A73E8]/10 border border-[#1A73E8]/20 space-y-3 text-center">
            <Sparkles className="w-6 h-6 text-[#1A73E8] mx-auto" />
            <p className="text-sm font-bold text-[#202124]">
              Seu navegador suporta instalação instantânea em 1 clique!
            </p>
            <button
              onClick={() => {
                onInstall();
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-sm shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Instalar Aplicativo Agora</span>
            </button>
          </div>
        ) : null}

        {/* Instructions by Device */}
        <div className="space-y-3">
          
          {/* Android Chrome */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#34A853]/15 text-[#1E8E3E] flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#202124]">Android (Google Chrome)</h4>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito do Chrome e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
              </p>
            </div>
          </div>

          {/* iOS Safari */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E8EAED] text-[#3C4043] flex items-center justify-center shrink-0 mt-0.5">
              <Apple className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#202124]">iPhone / iPad (Safari)</h4>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Toque no botão <strong>Compartilhar (quadrado com seta para cima)</strong> na barra inferior do Safari e escolha <strong>"Adicionar à Tela de Início"</strong>.
              </p>
            </div>
          </div>

          {/* Desktop Chrome / Edge */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1A73E8]/15 text-[#1A73E8] flex items-center justify-center shrink-0 mt-0.5">
              <Monitor className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#202124]">Computador (Chrome / Edge / Brave)</h4>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Clique no ícone de <strong>instalação de aplicativo</strong> na barra de endereços (ao lado da estrela de favoritos) ou vá em <strong>Menu &gt; Salvar e compartilhar &gt; Instalar página como app</strong>.
              </p>
            </div>
          </div>

        </div>

        {/* Benefits list */}
        <div className="pt-2 border-t border-[#E8EAED] grid grid-cols-2 gap-2 text-[11px] text-[#5F6368] font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1E8E3E]" />
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
            className="px-5 py-2.5 rounded-xl bg-[#202124] hover:bg-[#3C4043] text-white text-xs font-bold"
          >
            Entendi
          </button>
        </div>

      </div>
    </div>
  );
};
