import React from 'react';
import { Modal, ModalHeader } from './ui/Modal';
import { Settings, Moon, Sun } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isDarkMode, onToggleDarkMode }) => {
  if (!isOpen) return null;

  return (
    <Modal labelledBy="settings-heading" onClose={onClose} size="md">
      <ModalHeader
        titleId="settings-heading"
        title="Configurações"
        subtitle="Preferências de exibição do aplicativo."
        icon={Settings}
        iconClassName="bg-gray-100 text-gray-700"
        onClose={onClose}
      />
      <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
              {isDarkMode ? (
                <Moon className="w-4.5 h-4.5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-4.5 h-4.5 text-warning-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Modo escuro</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{isDarkMode ? 'Ativado' : 'Desativado'}</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={isDarkMode}
            aria-label="Alternar modo escuro"
            onClick={onToggleDarkMode}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              isDarkMode ? 'bg-primary' : 'bg-gray-300'
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
    </Modal>
  );
};
