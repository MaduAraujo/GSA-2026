import React, { useState } from 'react';
import { Modal, ModalHeader } from './ui/Modal';
import { Button } from './ui/Button';
import { Settings, Moon, Sun, Trash2, Loader2 } from 'lucide-react';
import { ACCOUNT_DELETE_CONFIRMATION, deleteAccount as deleteAccountRequest } from '../services/accountApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onDeleteAccount?: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleDarkMode,
  onDeleteAccount = deleteAccountRequest,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen) return null;

  const canDelete = confirmationText.trim().toUpperCase() === ACCOUNT_DELETE_CONFIRMATION;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteAccount();
      onClose();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Não foi possível excluir a conta. Tente novamente.');
      setIsDeleting(false);
    }
  };

  return (
    <Modal labelledBy="settings-heading" onClose={onClose} size="md">
      <ModalHeader
        titleId="settings-heading"
        title="Configurações"
        subtitle="Preferências de exibição e da sua conta."
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

        <section
          aria-labelledby="delete-account-heading"
          className="p-4 rounded-xl border border-danger-300/60 bg-danger-50/40 dark:bg-danger-600/10 dark:border-danger-600/40 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-900 border border-danger-300/60 dark:border-danger-600/40 flex items-center justify-center shrink-0">
              <Trash2 className="w-4.5 h-4.5 text-danger-600" aria-hidden="true" />
            </div>
            <div>
              <h3 id="delete-account-heading" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Excluir minha conta
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Apaga de forma permanente sua conta, seus registros e todos os arquivos enviados. Não dá para desfazer.
              </p>
            </div>
          </div>

          {!isConfirming ? (
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setIsConfirming(true)}>
                Excluir conta…
              </Button>
            </div>
          ) : (
            <form onSubmit={handleDelete} className="space-y-3">
              <label htmlFor="delete-account-confirmation" className="block text-xs text-gray-700 dark:text-gray-300">
                Para confirmar, digite <strong>{ACCOUNT_DELETE_CONFIRMATION}</strong> abaixo.
              </label>
              <input
                id="delete-account-confirmation"
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                disabled={isDeleting}
                aria-describedby={deleteError ? 'delete-account-error' : undefined}
                aria-invalid={deleteError ? true : undefined}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus-visible:outline-2 focus-visible:outline-danger-600"
              />
              {deleteError && (
                <p id="delete-account-error" role="alert" className="text-xs text-danger-700 dark:text-danger-300">
                  {deleteError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => {
                    setIsConfirming(false);
                    setConfirmationText('');
                    setDeleteError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={!canDelete || isDeleting}
                  aria-busy={isDeleting || undefined}
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {isDeleting ? 'Excluindo…' : 'Excluir permanentemente'}
                </Button>
              </div>
            </form>
          )}
        </section>

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
