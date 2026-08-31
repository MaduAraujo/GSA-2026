import React from 'react';
import { Settings, Moon, Sun, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleDarkMode,
}) => {
  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl flex flex-col">
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">

          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                  Configurações
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Preferências de exibição do aplicativo.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                {isDarkMode ? <Moon className="w-4.5 h-4.5 text-gray-700 dark:text-gray-300" /> : <Sun className="w-4.5 h-4.5 text-[#F9AB00]" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Modo escuro</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isDarkMode ? 'Ativado' : 'Desativado'}
                </p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={isDarkMode}
              aria-label="Alternar modo escuro"
              onClick={onToggleDarkMode}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                isDarkMode ? 'bg-[#1A73E8]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  isDarkMode ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold"
            >
              Concluído
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
