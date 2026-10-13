import { Download, ExternalLink, FileText, Loader2, Sparkles, Star, Trash2, X } from 'lucide-react';
import { useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { Certificate } from '../../types';
import { formatDateBR } from '../../utils/date';
import { formatDuration } from '../../utils/duration';
import { isHttpUrl } from '../../utils/safeUrl';

interface CertificateDetailModalProps {
  cert: Certificate;
  isDeleting: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onCreatePost: () => void;
}

export function CertificateDetailModal({
  cert,
  isDeleting,
  onClose,
  onToggleFavorite,
  onDelete,
  onCreatePost,
}: CertificateDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={cert.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col"
      >
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-end pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleFavorite}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#FBBC04]"
                aria-label="Favoritar"
                aria-pressed={!!cert.isFavorite}
                title="Favoritar"
              >
                <Star className={`w-5 h-5 ${cert.isFavorite ? 'fill-[#FBBC04] text-[#FBBC04]' : ''}`} />
              </button>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {cert.fileData && (
            <div className="bg-gray-900/5 rounded-2xl p-4 flex items-center justify-center max-h-80 overflow-hidden border border-gray-200">
              {cert.fileType === 'pdf' ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <FileText className="w-16 h-16 text-[#EA4335]" />
                  <p className="text-sm font-semibold text-gray-800">{cert.fileName || 'Certificado.pdf'}</p>
                  <a
                    href={cert.fileData}
                    download={cert.fileName || 'certificado.pdf'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-xs hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 text-[#1A73E8]" />
                    <span>Baixar Documento PDF</span>
                  </a>
                </div>
              ) : (
                <img
                  src={cert.fileData}
                  alt={cert.title}
                  className="max-h-72 w-auto object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{cert.issuer}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{cert.title}</h2>
            </div>

            {cert.description && (
              <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-gray-200 text-sm text-gray-700 leading-relaxed">
                {cert.description}
              </div>
            )}

            {cert.skills && cert.skills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Habilidades Desenvolvidas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {cert.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20"
                    >
                      #{skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] text-gray-500 uppercase font-semibold">Data de Emissão</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{formatDateBR(cert.issueDate)}</p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] text-gray-500 uppercase font-semibold">Carga Horária</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{formatDuration(cert.hours, cert.minutes)}</p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] text-gray-500 uppercase font-semibold">Categoria</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{cert.category}</p>
              </div>

              {cert.credentialId && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[11px] text-gray-500 uppercase font-semibold">ID da Credencial</span>
                  <p className="text-xs font-mono font-bold text-gray-900 mt-0.5 truncate">{cert.credentialId}</p>
                </div>
              )}

              {isHttpUrl(cert.credentialUrl) && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[11px] text-gray-500 uppercase font-semibold">Link de Validação</span>
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-[#1A73E8] hover:underline mt-0.5"
                  >
                    <span>Verificar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Excluir certificado"
              title="Excluir Certificado"
              className="p-2.5 rounded-xl text-[#EA4335] border border-gray-200 hover:bg-[#EA4335]/10 transition-all active:scale-95 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onCreatePost}
              aria-label="Gerar post comemorativo no Gemini"
              title="Gerar Post comemorativo no Gemini"
              className="p-2.5 rounded-xl bg-[#EA4335] hover:bg-[#D93025] text-white shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#FBBC04]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
