import {
  Award,
  BadgeCheck,
  Calendar,
  Clock,
  EyeOff,
  FileText,
  Globe,
  Pencil,
  Share2,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import type { Certificate } from '../../types';
import { ActionMenu, type ActionMenuItem } from '../ActionMenu';
import { formatDateBR } from '../../utils/date';
import { formatDuration } from '../../utils/duration';
import { linkedInAddCertificationUrl } from '../../utils/linkedin';
import { isHttpUrl } from '../../utils/safeUrl';

interface CertificateActions {
  onOpen: (cert: Certificate) => void;
  onEdit: (cert: Certificate) => void;
  onToggleFavorite: (cert: Certificate) => void;
  onTogglePortfolio: (cert: Certificate) => void;
  onCreatePost: (cert: Certificate) => void;
  onDelete: (cert: Certificate) => void;
}

function certificateMenuItems(cert: Certificate, actions: CertificateActions): ActionMenuItem[] {
  return [
    { label: 'Editar', icon: Pencil, onSelect: () => actions.onEdit(cert) },
    { label: 'Gerar post', icon: Sparkles, onSelect: () => actions.onCreatePost(cert) },
    cert.showInPortfolio === false
      ? { label: 'Mostrar no portfólio', icon: Globe, onSelect: () => actions.onTogglePortfolio(cert) }
      : { label: 'Ocultar do portfólio', icon: EyeOff, onSelect: () => actions.onTogglePortfolio(cert) },
    {
      label: 'Adicionar ao LinkedIn',
      icon: Share2,
      onSelect: () => window.open(linkedInAddCertificationUrl(cert), '_blank', 'noopener,noreferrer'),
    },
    { label: 'Excluir', icon: Trash2, onSelect: () => actions.onDelete(cert), tone: 'danger' },
  ];
}

export function HiddenFromPortfolioBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      title="Este certificado não aparece no portfólio público"
      className={`inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg border border-gray-200 shrink-0 ${
        compact ? 'p-1' : 'px-2 py-1'
      }`}
    >
      <EyeOff aria-hidden="true" className="w-3 h-3" />
      <span className={compact ? 'sr-only' : undefined}>Oculto</span>
    </span>
  );
}

export function VerifiableBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      title="Possui link de verificação"
      className={`inline-flex items-center gap-1 text-xs font-semibold text-success-800 bg-success/10 rounded-lg border border-success/20 shrink-0 ${
        compact ? 'p-1' : 'px-2 py-1'
      }`}
    >
      <BadgeCheck aria-hidden="true" className="w-3 h-3" />
      <span className={compact ? 'sr-only' : undefined}>Verificável</span>
    </span>
  );
}

function CertificatePreview({
  cert,
  onOpen,
  onToggleFavorite,
}: { cert: Certificate } & Pick<CertificateActions, 'onOpen' | 'onToggleFavorite'>) {
  const isGoogleTheme = cert.category.includes('Google') || cert.category.includes('Gemini');
  return (
    <div className="relative h-44 w-full bg-linear-to-br from-gray-100 via-gray-200 to-gray-100 overflow-hidden group-hover:opacity-95">
      <button
        type="button"
        onClick={() => onOpen(cert)}
        aria-label={`Abrir ${cert.title}`}
        className="w-full h-full flex items-center justify-center p-4 cursor-pointer"
      >
        {cert.fileData ? (
          cert.fileType === 'pdf' ? (
            <div className="flex flex-col items-center gap-2 text-gray-600">
              <FileText className="w-12 h-12 text-danger" />
              <span className="text-xs font-semibold bg-white/90 px-2 py-0.5 rounded-md shadow-xs">Documento PDF</span>
            </div>
          ) : (
            <img
              src={cert.fileData}
              alt={cert.title}
              loading="lazy"
              className="w-full h-full object-contain rounded-xl shadow-xs"
            />
          )
        ) : (
          <div className="relative flex flex-col items-center justify-center text-center p-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-200 flex items-center justify-center mb-2">
              <Award className={`w-8 h-8 ${isGoogleTheme ? 'text-primary' : 'text-success'}`} />
            </div>
            <span className="text-xs font-bold text-gray-800 line-clamp-1">{cert.issuer}</span>
          </div>
        )}
      </button>

      <button
        type="button"
        onClick={() => onToggleFavorite(cert)}
        className={`absolute top-3 right-3 p-1.5 rounded-full shadow-xs transition-all active:scale-90 ${
          cert.isFavorite
            ? 'bg-warning-50 text-warning-600 ring-1 ring-warning/50'
            : 'bg-white/90 hover:bg-white text-gray-400 hover:text-warning'
        }`}
        aria-label={cert.isFavorite ? 'Remover dos favoritos' : 'Favoritar certificado'}
        aria-pressed={!!cert.isFavorite}
        title={cert.isFavorite ? 'Remover dos favoritos' : 'Favoritar certificado'}
      >
        <Star className={`w-4 h-4 ${cert.isFavorite ? 'fill-warning text-warning' : ''}`} />
      </button>
    </div>
  );
}

export function CertificateGrid({ certificates, ...actions }: { certificates: Certificate[] } & CertificateActions) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {certificates.map((cert) => (
        <div
          key={cert.id}
          id={`cert-card-${cert.id}`}
          className="group relative flex flex-col bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-primary/40 transition-all overflow-hidden"
        >
          <CertificatePreview cert={cert} onOpen={actions.onOpen} onToggleFavorite={actions.onToggleFavorite} />

          <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{cert.issuer}</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDateBR(cert.issueDate)}</span>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
                <button type="button" onClick={() => actions.onOpen(cert)} className="text-left hover:text-primary">
                  {cert.title}
                </button>
              </h3>

              {cert.description && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{cert.description}</p>
              )}
            </div>

            {cert.skills && cert.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cert.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium bg-gray-100 text-gray-700"
                  >
                    #{skill}
                  </span>
                ))}
                {cert.skills.length > 3 && (
                  <span className="text-2xs text-gray-400 self-center font-medium">+{cert.skills.length - 3}</span>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                {cert.hours || cert.minutes ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                    <Clock className="w-3 h-3 text-success" />
                    <span>{formatDuration(cert.hours, cert.minutes)}</span>
                  </span>
                ) : null}

                {isHttpUrl(cert.credentialUrl) && <VerifiableBadge />}
                {cert.showInPortfolio === false && <HiddenFromPortfolioBadge />}
              </div>

              <ActionMenu label={`Mais ações para ${cert.title}`} items={certificateMenuItems(cert, actions)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CertificateTable({ certificates, ...actions }: { certificates: Certificate[] } & CertificateActions) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-gray-600 text-xs font-semibold border-b border-gray-200">
            <tr>
              <th className="py-3.5 px-4">Certificado</th>
              <th className="py-3.5 px-4">Emissor</th>
              <th className="py-3.5 px-4">Categoria</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Data</th>
              <th className="py-3.5 px-4 text-right">Carga</th>
              <th className="py-3.5 px-4">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {certificates.map((cert) => (
              <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => actions.onToggleFavorite(cert)}
                      aria-label={cert.isFavorite ? 'Remover dos favoritos' : 'Favoritar certificado'}
                      aria-pressed={!!cert.isFavorite}
                      title={cert.isFavorite ? 'Remover dos favoritos' : 'Favoritar certificado'}
                      className="p-1 -m-1 rounded-lg text-gray-300 hover:text-warning transition-all active:scale-90 shrink-0"
                    >
                      <Star className={`w-4 h-4 ${cert.isFavorite ? 'fill-warning text-warning' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.onOpen(cert)}
                      className="text-left hover:text-primary cursor-pointer min-w-40"
                    >
                      {cert.title}
                    </button>
                    {isHttpUrl(cert.credentialUrl) && <VerifiableBadge compact />}
                    {cert.showInPortfolio === false && <HiddenFromPortfolioBadge compact />}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-gray-600 text-xs">{cert.issuer}</td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {cert.category}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap tabular-nums">
                  {formatDateBR(cert.issueDate)}
                </td>
                <td className="py-3.5 px-4 text-xs font-semibold text-gray-700 text-right whitespace-nowrap tabular-nums">
                  {formatDuration(cert.hours, cert.minutes)}
                </td>
                <td className="py-3 px-4 text-right">
                  <ActionMenu label={`Mais ações para ${cert.title}`} items={certificateMenuItems(cert, actions)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
