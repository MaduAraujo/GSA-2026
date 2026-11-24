import {
  Download,
  ExternalLink,
  EyeOff,
  FileText,
  Globe,
  Pencil,
  Share2,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { Certificate } from '../../types';
import { formatDateBR } from '../../utils/date';
import { formatDuration } from '../../utils/duration';
import { linkedInAddCertificationUrl } from '../../utils/linkedin';
import { isHttpUrl } from '../../utils/safeUrl';
import { HiddenFromPortfolioBadge, VerifiableBadge } from './CertificateViews';

interface CertificateDetailModalProps {
  cert: Certificate;
  onClose: () => void;
  onToggleFavorite: () => void;
  onTogglePortfolio: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreatePost: () => void;
}

export function CertificateDetailModal({
  cert,
  onClose,
  onToggleFavorite,
  onTogglePortfolio,
  onEdit,
  onDelete,
  onCreatePost,
}: CertificateDetailModalProps) {
  return (
    <Modal onClose={onClose} labelledBy="cert-detail-heading" size="3xl">
      <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="min-w-0">
            {cert.issuer && <span className="text-xs font-semibold text-gray-500">{cert.issuer}</span>}
            <h2 id="cert-detail-heading" className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 leading-snug">
              {cert.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {isHttpUrl(cert.credentialUrl) && <VerifiableBadge />}
              {cert.showInPortfolio === false && <HiddenFromPortfolioBadge />}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 -mt-1 -mr-2">
            <button
              type="button"
              onClick={onTogglePortfolio}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-primary transition-transform active:scale-90"
              aria-label={
                cert.showInPortfolio === false ? 'Mostrar no portfólio público' : 'Ocultar do portfólio público'
              }
              aria-pressed={cert.showInPortfolio !== false}
              title={cert.showInPortfolio === false ? 'Mostrar no portfólio público' : 'Ocultar do portfólio público'}
            >
              {cert.showInPortfolio === false ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Globe className="w-5 h-5 text-primary" />
              )}
            </button>
            <button
              type="button"
              onClick={onToggleFavorite}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-warning transition-transform active:scale-90"
              aria-label={cert.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
              aria-pressed={!!cert.isFavorite}
              title={cert.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            >
              <Star className={`w-5 h-5 ${cert.isFavorite ? 'fill-warning text-warning' : ''}`} />
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

        {cert.fileData && cert.fileType === 'pdf' && isHttpUrl(cert.fileData) ? (
          <div className="space-y-2">
            <div className="h-[55vh] max-h-[32rem] rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <iframe src={cert.fileData} title={`PDF de ${cert.title}`} className="w-full h-full" />
            </div>
            <div className="flex justify-end">
              <a
                href={cert.fileData}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir em nova aba</span>
              </a>
            </div>
          </div>
        ) : (
          cert.fileData && (
            <div className="bg-gray-900/5 rounded-2xl p-4 flex items-center justify-center max-h-80 overflow-hidden border border-gray-200">
              {cert.fileType === 'pdf' ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <FileText className="w-16 h-16 text-danger" />
                  <p className="text-sm font-semibold text-gray-800">{cert.fileName || 'Certificado.pdf'}</p>
                  <a
                    href={cert.fileData}
                    download={cert.fileName || 'certificado.pdf'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-xs hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 text-primary" />
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
          )
        )}

        <div className="space-y-4">
          {cert.description && (
            <div className="p-4 rounded-2xl bg-surface-muted border border-gray-200 text-sm text-gray-700 leading-relaxed">
              {cert.description}
            </div>
          )}

          {cert.skills && cert.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-2">Habilidades Desenvolvidas</h4>
              <div className="flex flex-wrap gap-2">
                {cert.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                  >
                    #{skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-2xs text-gray-500 font-semibold">Data de Emissão</span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatDateBR(cert.issueDate)}</p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-2xs text-gray-500 font-semibold">Carga Horária</span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatDuration(cert.hours, cert.minutes)}</p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-2xs text-gray-500 font-semibold">Categoria</span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{cert.category}</p>
            </div>

            {cert.credentialId && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-2xs text-gray-500 font-semibold">ID da Credencial</span>
                <p className="text-xs font-mono font-bold text-gray-900 mt-0.5 truncate">{cert.credentialId}</p>
              </div>
            )}

            {isHttpUrl(cert.credentialUrl) && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-2xs text-gray-500 font-semibold">Link de Validação</span>
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline mt-0.5"
                >
                  <span>Verificar</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onDelete}
            aria-label="Excluir certificado"
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-danger-600 hover:bg-danger/10 transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Excluir</span>
          </button>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <a
              href={linkedInAddCertificationUrl(cert)}
              target="_blank"
              rel="noreferrer"
              title="Abre o LinkedIn com a certificação já preenchida"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>
                <span className="hidden sm:inline">Adicionar ao </span>LinkedIn
              </span>
            </a>

            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
            >
              <Pencil className="w-4 h-4" />
              <span>Editar</span>
            </button>

            <button
              onClick={onCreatePost}
              title="Gerar um post comemorativo com o Gemini"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-700 text-white shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar post</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
