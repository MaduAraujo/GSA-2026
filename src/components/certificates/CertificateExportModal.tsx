import { FileDown } from 'lucide-react';
import { buttonClasses } from '../ui/buttonClasses';
import { Modal, ModalHeader } from '../ui/Modal';
import { useState } from 'react';
import type { AmbassadorProfile, Certificate } from '../../types';
import { formatDateBR } from '../../utils/date';
import { exportPortfolioAsPdf } from '../../utils/portfolioExport';
import { POPUP_BLOCKED_MESSAGE } from '../../utils/popup';
import { useToast } from '../../app/ToastProvider';

interface CertificateExportModalProps {
  certificates: Certificate[];
  profile: AmbassadorProfile;
  preselectedIds?: string[];
  onClose: () => void;
}

export function CertificateExportModal({
  certificates,
  profile,
  preselectedIds,
  onClose,
}: CertificateExportModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(preselectedIds ?? certificates.map((c) => c.id)),
  );
  const allSelected = selectedIds.size === certificates.length;
  const toast = useToast();

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const opened = exportPortfolioAsPdf(
      profile,
      certificates.filter((c) => selectedIds.has(c.id)),
    );
    if (!opened) {
      toast.show({ message: POPUP_BLOCKED_MESSAGE, tone: 'error' });
      return;
    }
    onClose();
  };

  return (
    <Modal labelledBy="cert-export-heading" onClose={onClose} label="Selecionar certificados para exportar">
      <ModalHeader
        titleId="cert-export-heading"
        title="Exportar"
        subtitle={preselectedIds ? 'Pré-selecionados conforme os filtros atuais' : 'Escolha o que deve ser exportado'}
        icon={FileDown}
        iconClassName="bg-primary/10 text-primary"
        onClose={onClose}
      />

      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">
          {selectedIds.size} de {certificates.length} selecionado{certificates.length === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={() => setSelectedIds(allSelected ? new Set() : new Set(certificates.map((c) => c.id)))}
          className="text-xs font-bold text-primary hover:underline"
        >
          {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
        {certificates.map((cert) => (
          <label key={cert.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.has(cert.id)}
              onChange={() => toggle(cert.id)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus-visible:ring-primary/30 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{cert.title}</p>
              <p className="text-xs text-gray-500 truncate">
                {cert.issuer} · {formatDateBR(cert.issueDate)}
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="p-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
        <button type="button" onClick={onClose} className={buttonClasses({ variant: 'ghost' })}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={selectedIds.size === 0}
          className={buttonClasses({ variant: 'primary' })}
        >
          <FileDown className="w-4 h-4" />
          <span>Exportar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
        </button>
      </div>
    </Modal>
  );
}
