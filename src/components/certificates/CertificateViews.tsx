import { Award, Calendar, Clock, Eye, FileText, Pencil, Sparkles, Star } from 'lucide-react';
import type { Certificate } from '../../types';
import { formatDateBR } from '../../utils/date';
import { formatDuration } from '../../utils/duration';

interface CertificateActions {
  onOpen: (cert: Certificate) => void;
  onEdit: (cert: Certificate) => void;
  onToggleFavorite: (cert: Certificate) => void;
  onCreatePost: (cert: Certificate) => void;
}

function CertificatePreview({
  cert,
  onOpen,
  onToggleFavorite,
}: { cert: Certificate } & Pick<CertificateActions, 'onOpen' | 'onToggleFavorite'>) {
  const isGoogleTheme = cert.category.includes('Google') || cert.category.includes('Gemini');
  return (
    <div className="relative h-44 w-full bg-linear-to-br from-[#F1F5F9] via-[#E2E8F0] to-[#EEF2F6] overflow-hidden group-hover:opacity-95">
      <button
        type="button"
        onClick={() => onOpen(cert)}
        aria-label={`Abrir ${cert.title}`}
        className="w-full h-full flex items-center justify-center p-4 cursor-pointer"
      >
        {cert.fileData ? (
          cert.fileType === 'pdf' ? (
            <div className="flex flex-col items-center gap-2 text-gray-600">
              <FileText className="w-12 h-12 text-[#EA4335]" />
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
              <Award className={`w-8 h-8 ${isGoogleTheme ? 'text-[#1A73E8]' : 'text-[#34A853]'}`} />
            </div>
            <span className="text-xs font-bold text-gray-800 line-clamp-1">{cert.issuer}</span>
            <span className="text-[11px] text-gray-500">Certificado Verificado</span>
          </div>
        )}
      </button>

      <button
        onClick={() => onToggleFavorite(cert)}
        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-[#FBBC04] shadow-xs transition-all"
        aria-label="Favoritar certificado"
        aria-pressed={!!cert.isFavorite}
        title="Favoritar Certificado"
      >
        <Star className={`w-4 h-4 ${cert.isFavorite ? 'fill-[#FBBC04] text-[#FBBC04]' : ''}`} />
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
          className="group relative flex flex-col bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#1A73E8]/40 transition-all overflow-hidden"
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
                <button type="button" onClick={() => actions.onOpen(cert)} className="text-left hover:text-[#1A73E8]">
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
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700"
                  >
                    #{skill}
                  </span>
                ))}
                {cert.skills.length > 3 && (
                  <span className="text-[11px] text-gray-400 self-center font-medium">+{cert.skills.length - 3}</span>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {cert.hours || cert.minutes ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                    <Clock className="w-3 h-3 text-[#34A853]" />
                    <span>{formatDuration(cert.hours, cert.minutes)}</span>
                  </span>
                ) : null}

                {cert.credentialId && (
                  <span className="text-[10px] text-gray-400 font-mono">ID: {cert.credentialId.slice(0, 10)}...</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => actions.onEdit(cert)}
                  className="p-1.5 rounded-xl bg-gray-100 hover:bg-[#1A73E8]/10 hover:text-[#1A73E8] text-gray-600 transition-all"
                  aria-label="Editar certificado"
                  title="Editar Certificado"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  onClick={() => actions.onOpen(cert)}
                  className="p-1.5 rounded-xl bg-gray-100 hover:bg-[#1A73E8]/10 hover:text-[#1A73E8] text-gray-600 transition-all"
                  aria-label="Visualizar Detalhes"
                  title="Visualizar Detalhes"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
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
        <table className="w-full text-center text-sm">
          <thead className="bg-[#F8FAFD] text-gray-600 text-xs font-semibold border-b border-gray-200">
            <tr>
              <th className="py-3.5 px-4">Certificado</th>
              <th className="py-3.5 px-4">Emissor</th>
              <th className="py-3.5 px-4">Categoria</th>
              <th className="py-3.5 px-4">Data</th>
              <th className="py-3.5 px-4">Carga</th>
              <th className="py-3.5 px-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {certificates.map((cert) => (
              <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-gray-900">
                  <div className="flex items-center justify-center gap-2.5">
                    <Award className="w-4 h-4 text-[#1A73E8] shrink-0" />
                    <button
                      type="button"
                      onClick={() => actions.onOpen(cert)}
                      className="hover:text-[#1A73E8] cursor-pointer"
                    >
                      {cert.title}
                    </button>
                    {cert.isFavorite && (
                      <Star className="w-3.5 h-3.5 fill-[#FBBC04] text-[#FBBC04]" aria-label="Favorito" />
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-gray-600 text-xs">{cert.issuer}</td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {cert.category}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-500">{formatDateBR(cert.issueDate)}</td>
                <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                  {formatDuration(cert.hours, cert.minutes)}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => actions.onCreatePost(cert)}
                      className="p-1.5 rounded-lg text-[#D93025] hover:bg-[#EA4335]/10"
                      aria-label="Criar post no Gemini"
                      title="Criar post no Gemini"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => actions.onEdit(cert)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                      aria-label="Editar certificado"
                      title="Editar Certificado"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => actions.onOpen(cert)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                      aria-label="Visualizar detalhes"
                      title="Visualizar Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
