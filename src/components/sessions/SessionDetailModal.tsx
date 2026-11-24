import {
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  Flag,
  History,
  NotebookPen,
  Paperclip,
  Pencil,
  Star,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../routes';
import type { AmbassadorSession } from '../../types';
import { formatDateBR } from '../../utils/date';
import { MarkdownText } from '../MarkdownText';
import { Modal } from '../ui/Modal';
import { formatFileSize, splitAttachments } from './sessionFiles';
import { sessionTypeLabels } from './sessionTypes';
import { findPastSession, formatMinutes, parseTools } from './sessionView';

interface SessionDetailModalProps {
  session: AmbassadorSession;
  position: { index: number; total: number };
  onNavigate: (offset: -1 | 1) => void;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddProof: () => void;
}

const sectionLabel = 'text-2xs font-semibold text-gray-500';
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && !!target.closest('input, textarea, select, video, [contenteditable="true"]');

export function SessionDetailModal({
  session,
  position,
  onNavigate,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onAddProof,
}: SessionDetailModalProps) {
  const { images, documents } = splitAttachments(session.challengeFiles);
  const labels = sessionTypeLabels(session);
  const tools = parseTools(session.toolLearned);
  const past = findPastSession(session.pastSessionId);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const hasPrev = position.index > 0;
  const hasNext = position.index < position.total - 1;

  const [shownId, setShownId] = useState(session.id);
  if (shownId !== session.id) {
    setShownId(session.id);
    setLightbox(null);
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (lightbox !== null) {
        if (e.key === 'Escape') setLightbox(null);
        else if (e.key === 'ArrowLeft') setLightbox((i) => (i! > 0 ? i! - 1 : i));
        else if (e.key === 'ArrowRight') setLightbox((i) => (i! < images.length - 1 ? i! + 1 : i));
        else return;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (isTyping(e.target)) return;
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(-1);
      else if (e.key === 'ArrowRight' && hasNext) onNavigate(1);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [lightbox, images.length, hasPrev, hasNext, onNavigate]);

  const lightboxImage = lightbox !== null ? images[lightbox] : undefined;

  const closeButton = (dark: boolean) => (
    <button
      onClick={onClose}
      aria-label="Fechar"
      className={
        dark
          ? 'p-2 rounded-full bg-black/50 hover:bg-black/70 text-white'
          : 'p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600'
      }
    >
      <X className="w-5 h-5" />
    </button>
  );

  return (
    <Modal onClose={onClose} label={session.title}>
      <div className="overflow-y-auto">
        {session.proofImage ? (
          <div className="relative bg-gray-900">
            {session.proofMediaType === 'video' ? (
              <video key={session.id} src={session.proofImage} controls className="w-full max-h-[50vh]" />
            ) : (
              <img src={session.proofImage} alt={session.title} className="w-full max-h-[50vh] object-contain" />
            )}
            <div className="absolute top-3 right-3">{closeButton(true)}</div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-5 pb-0">
            <button
              type="button"
              onClick={onAddProof}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-warning/60 bg-warning/5 text-xs font-semibold text-warning-700 hover:bg-warning/10"
            >
              <Camera aria-hidden="true" className="w-4 h-4" />
              Anexar comprovação
            </button>
            {closeButton(false)}
          </div>
        )}

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-2xs font-semibold text-success-700">{labels.type}</p>
            <h3 className="font-bold text-gray-900 text-lg leading-snug">{session.title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                <Calendar aria-hidden="true" className="w-3.5 h-3.5" />
                {formatDateBR(session.date)}
              </span>
              {session.durationMinutes ? (
                <span className="flex items-center gap-1">
                  <Clock aria-hidden="true" className="w-3.5 h-3.5" />
                  {formatMinutes(session.durationMinutes)}
                </span>
              ) : null}
              {session.score ? (
                <span className="flex items-center gap-1">
                  <Star aria-hidden="true" className="w-3.5 h-3.5 text-warning" />
                  {session.score} pontos
                </span>
              ) : null}
            </div>
          </div>

          {past && (
            <Link
              to={ROUTES.pastSessions}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-gray-700 hover:bg-primary/10 transition-colors"
            >
              <History aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1 min-w-0">
                Encontro oficial: <strong className="font-semibold">{past.series ?? past.title}</strong>
                {past.series && <span className="text-gray-500"> · {past.title}</span>}
              </span>
              <span className="text-primary font-semibold shrink-0">Ver no Acervo</span>
            </Link>
          )}

          {session.challenge && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <Flag aria-hidden="true" className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className={sectionLabel}>Desafio proposto</p>
                <p>{session.challenge}</p>
              </div>
            </div>
          )}

          {images.length > 0 && (
            <div>
              <p className={`${sectionLabel} mb-1.5`}>Imagens do desafio</p>
              <div className="grid grid-cols-3 gap-2">
                {images.map((file, i) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setLightbox(i)}
                    aria-label={`Ampliar ${file.name}`}
                    className="block aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:opacity-90 transition-opacity"
                  >
                    <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {documents.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <Paperclip aria-hidden="true" className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className={`${sectionLabel} mb-1`}>Anexos do desafio</p>
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
                      <FileText aria-hidden="true" className="w-3.5 h-3.5 text-success shrink-0" />
                      <span className="text-xs font-medium text-gray-700 truncate flex-1">{file.name}</span>
                      <span className="text-2xs text-gray-400 shrink-0">{formatFileSize(file.fileSize)}</span>
                      <Download aria-hidden="true" className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-sm text-gray-700">
            <Wrench aria-hidden="true" className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className={`${sectionLabel} mb-1`}>
                {tools.length > 1 ? 'Ferramentas aprendidas' : 'Ferramenta aprendida'}
              </p>
              {tools.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary-700 text-xs font-semibold"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Não informado</p>
              )}
            </div>
          </div>

          {session.notes?.trim() && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <NotebookPen aria-hidden="true" className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className={`${sectionLabel} mb-1`}>Anotações</p>
                <MarkdownText text={session.notes} className="text-sm" />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onNavigate(-1)}
                disabled={!hasPrev}
                aria-label="Registro anterior"
                title="Anterior (←)"
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-2xs font-semibold text-gray-400 tabular-nums">
                {position.index + 1} de {position.total}
              </span>
              <button
                type="button"
                onClick={() => onNavigate(1)}
                disabled={!hasNext}
                aria-label="Próximo registro"
                title="Próximo (→)"
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-xl"
                aria-label={`Editar ${labels.noun}`}
                title={labels.editLabel}
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
              <button
                onClick={onDuplicate}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-xl"
                aria-label={`Duplicar ${labels.noun}`}
                title="Criar um novo registro a partir deste"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Duplicar</span>
              </button>
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:bg-danger/10 px-3 py-2 rounded-xl"
                aria-label={`Excluir ${labels.noun}`}
                title={`Excluir ${labels.noun}`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {lightboxImage && lightbox !== null && (
        <div
          role="group"
          aria-label={`Imagem ${lightbox + 1} de ${images.length}: ${lightboxImage.name}`}
          className="absolute inset-0 z-10 bg-black/95 flex items-center justify-center p-4"
        >
          <img src={lightboxImage.dataUrl} alt={lightboxImage.name} className="max-w-full max-h-full object-contain" />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- move focus into the overlay that covers the modal
            autoFocus
            aria-label="Fechar imagem"
            className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setLightbox(lightbox - 1)}
                disabled={lightbox === 0}
                aria-label="Imagem anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightbox(lightbox + 1)}
                disabled={lightbox === images.length - 1}
                aria-label="Próxima imagem"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-white/80 tabular-nums">
                {lightbox + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
