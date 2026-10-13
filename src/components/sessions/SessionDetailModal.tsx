import { Calendar, Download, FileText, Flag, Loader2, Paperclip, Pencil, Star, Trash2, Wrench, X } from 'lucide-react';
import { useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { AmbassadorSession } from '../../types';
import { formatDateBR } from '../../utils/date';
import { formatFileSize, splitAttachments } from './sessionFiles';

interface SessionDetailModalProps {
  session: AmbassadorSession;
  isDeleting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SessionDetailModal({ session, isDeleting, onClose, onEdit, onDelete }: SessionDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onClose);
  const { images, documents } = splitAttachments(session.challengeFiles);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={session.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col"
      >
        <div className="overflow-y-auto">
          {session.proofImage ? (
            <div className="relative bg-gray-900">
              {session.proofMediaType === 'video' ? (
                <video src={session.proofImage} controls className="w-full max-h-[50vh]" />
              ) : (
                <img src={session.proofImage} alt={session.title} className="w-full max-h-[50vh] object-contain" />
              )}
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-5 pb-0">
              <div />
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-gray-900 text-lg">{session.title}</h3>
              <div className="flex items-center gap-2 shrink-0">
                {session.score ? (
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#FBBC04]" />
                    {session.score}
                  </span>
                ) : null}
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDateBR(session.date)}
                </span>
              </div>
            </div>

            {session.challenge && (
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <Flag className="w-4 h-4 text-[#FBBC04] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Desafio proposto</p>
                  <p>{session.challenge}</p>
                </div>
              </div>
            )}

            {(images.length > 0 || documents.length > 0) && (
              <div className="space-y-2">
                {images.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Imagens do desafio
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((file) => (
                        <a
                          key={file.id}
                          href={file.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:opacity-90 transition-opacity"
                        >
                          <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {documents.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <Paperclip className="w-4 h-4 text-[#34A853] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Anexos do desafio
                      </p>
                      <div className="space-y-1.5">
                        {documents.map((file) => (
                          <a
                            key={file.id}
                            href={file.dataUrl}
                            download={file.name}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#34A853] shrink-0" />
                            <span className="text-xs font-medium text-gray-700 truncate flex-1">{file.name}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">{formatFileSize(file.fileSize)}</span>
                            <Download className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 text-sm text-gray-700">
              <Wrench className="w-4 h-4 text-[#1A73E8] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ferramenta aprendida</p>
                <p>{session.toolLearned || 'Não informado'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-xl"
                aria-label="Editar sessão"
                title="Editar Sessão"
              >
                <Pencil className="w-4 h-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA4335] hover:bg-[#EA4335]/10 px-3 py-2 rounded-xl disabled:opacity-50"
                aria-label="Excluir sessão"
                title="Excluir Sessão"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
