import React from 'react';
import { Modal, ModalHeader } from './ui/Modal';
import type { BeforeInstallPromptEvent } from '../hooks/usePwaInstall';
import { Download, Smartphone, Monitor, Apple, CheckCircle2, Sparkles } from 'lucide-react';

interface PwaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstall: () => void;
}

export const PwaGuideModal: React.FC<PwaGuideModalProps> = ({ isOpen, onClose, deferredPrompt, onInstall }) => {
  if (!isOpen) return null;

  return (
    <Modal labelledBy="pwa-guide-heading" onClose={onClose} size="xl">
      <ModalHeader
        titleId="pwa-guide-heading"
        title="Instalar Aplicativo (PWA)"
        subtitle="Acesse seus certificados e prompts offline direto da tela inicial."
        icon={Download}
        iconClassName="bg-primary/10 text-primary"
        onClose={onClose}
      />
      <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
        {deferredPrompt ? (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3 text-center">
            <Sparkles className="w-6 h-6 text-primary mx-auto" />
            <p className="text-sm font-bold text-gray-900">Seu navegador suporta instalação instantânea em 1 clique!</p>
            <button
              onClick={() => {
                onInstall();
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-700 text-white font-bold text-sm shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Instalar Aplicativo Agora</span>
            </button>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/15 text-success-700 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-900">Android (Google Chrome)</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito do Chrome e selecione{' '}
                <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
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
                Toque no botão <strong>Compartilhar (quadrado com seta para cima)</strong> na barra inferior do Safari e
                escolha <strong>"Adicionar à Tela de Início"</strong>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Monitor className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-900">Computador (Chrome / Edge / Brave)</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Clique no ícone de <strong>instalação de aplicativo</strong> na barra de endereços (ao lado da estrela
                de favoritos) ou vá em <strong>Menu &gt; Salvar e compartilhar &gt; Instalar página como app</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200 grid grid-cols-2 gap-2 text-2xs text-gray-600 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success-700" />
            <span>Funciona Offline</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success-700" />
            <span>Sem ocupar espaço</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success-700" />
            <span>Acesso instantâneo</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success-700" />
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
    </Modal>
  );
};
