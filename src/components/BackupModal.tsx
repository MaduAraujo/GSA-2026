import React, { useState, useRef } from 'react';
import { HardDrive, Download, Upload, CheckCircle2, AlertTriangle, X, RefreshCw, FileDown } from 'lucide-react';
import { SupabaseStorageService as StorageService } from '../services/supabaseStorage';
import { AmbassadorProfile, Certificate } from '../types';
import { exportPortfolioAsPdf } from '../utils/portfolioExport';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
  profile: AmbassadorProfile;
  certificates: Certificate[];
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  profile,
  certificates,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const jsonBackup = await StorageService.exportAllData();
      const blob = new Blob([jsonBackup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `embaixadora-google-2026-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatusMessage('Backup baixado com sucesso!');
    } catch (e: any) {
      setStatusMessage(`Erro ao exportar: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const success = await StorageService.importAllData(text);
      if (success) {
        setStatusMessage('Dados importados com sucesso!');
        await onRefreshData();
      } else {
        setStatusMessage('Falha ao processar arquivo de backup.');
      }
    } catch (e: any) {
      setStatusMessage(`Erro ao importar: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#DADCE0] shadow-xl p-6 sm:p-8 space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-[#E8EAED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#34A853]/10 text-[#1E8E3E] flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#202124]">
                Backup e Sincronização
              </h3>
              <p className="text-xs text-[#5F6368]">
                Exporte ou restaure seus certificados, prompts e posts.
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

        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-[#E6F4EA] border border-[#CEEAD6] text-xs font-semibold text-[#137333] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1E8E3E]" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="space-y-4">

          {/* Portfolio Export Action */}
          <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] space-y-3">
            <div className="flex items-center gap-2.5">
              <FileDown className="w-5 h-5 text-[#EA4335]" />
              <h4 className="text-sm font-bold text-[#202124]">Exportar Portfólio (PDF)</h4>
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              Gera uma página imprimível com seu perfil e todos os certificados, pronta para salvar como PDF pelo navegador.
            </p>
            <button
              onClick={() => exportPortfolioAsPdf(profile, certificates)}
              disabled={certificates.length === 0}
              className="w-full py-2.5 rounded-xl bg-[#EA4335] hover:bg-[#D93025] text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>Gerar Portfólio para Impressão</span>
            </button>
          </div>

          {/* Export Action */}
          <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] space-y-3">
            <div className="flex items-center gap-2.5">
              <Download className="w-5 h-5 text-[#1A73E8]" />
              <h4 className="text-sm font-bold text-[#202124]">Exportar Backup Completo</h4>
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              Gera um arquivo JSON contendo todos os seus certificados com imagens, banco de prompts categorizados e posts do Gemini.
            </p>
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="w-full py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exportando...' : 'Baixar Arquivo de Backup'}</span>
            </button>
          </div>

          {/* Import Action */}
          <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] space-y-3">
            <div className="flex items-center gap-2.5">
              <Upload className="w-5 h-5 text-[#1E8E3E]" />
              <h4 className="text-sm font-bold text-[#202124]">Restaurar / Importar Backup</h4>
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              Selecione um arquivo de backup previamente exportado para recuperar todos os seus registros.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-[#F1F3F4] border border-[#DADCE0] text-[#3C4043] text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-[#1E8E3E]" />
              <span>{isImporting ? 'Importando...' : 'Selecionar Arquivo JSON'}</span>
            </button>
          </div>

        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#202124] hover:bg-[#3C4043] text-white text-xs font-bold"
          >
            Concluído
          </button>
        </div>

      </div>
    </div>
  );
};
