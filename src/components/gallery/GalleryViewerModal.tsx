import { Calendar, ChevronLeft, ChevronRight, Download, Loader2, Pencil, Share2, Trash2, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useEffect, useId, useRef, useState } from 'react';
import { useToast } from '../../app/ToastProvider';
import { useScrollLock } from '../../hooks/useScrollLock';
import type { GalleryPhoto } from '../../types';
import { formatDateBR } from '../../utils/date';
import { canShareFiles, downloadMedia, shareMedia } from './galleryMedia';

const SWIPE_THRESHOLD_PX = 50;

interface GalleryViewerModalProps {
  photos: GalleryPhoto[];
  index: number;
  onNavigate: (index: number) => void;
  onEdit: (photo: GalleryPhoto) => void;
  onDelete: (photo: GalleryPhoto) => void;
  onClose: () => void;
}

export function GalleryViewerModal({ photos, index, onNavigate, onEdit, onDelete, onClose }: GalleryViewerModalProps) {
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const titleId = useId();
  const toast = useToast();
  const [busyAction, setBusyAction] = useState<'download' | 'share' | null>(null);
  useScrollLock();

  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, video')) return;
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(index - 1);
      else if (e.key === 'ArrowRight' && hasNext) onNavigate(index + 1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [index, hasPrev, hasNext, onNavigate]);

  if (!photo) return null;

  const isVideo = photo.mediaType === 'video';
  const title = photo.caption || (isVideo ? 'Vídeo sem legenda' : 'Foto sem legenda');

  const runFileAction = async (action: 'download' | 'share') => {
    setBusyAction(action);
    try {
      if (action === 'download') await downloadMedia(photo);
      else if (!(await shareMedia(photo))) {
        toast.show({ message: 'Este dispositivo não permite compartilhar arquivos. Use “Baixar”.' });
      }
    } catch (err) {
      console.error(err);
      toast.show({
        message: action === 'download' ? 'Não foi possível baixar o arquivo.' : 'Não foi possível compartilhar.',
        tone: 'error',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeStartRef.current = touch && e.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = swipeStartRef.current;
    const touch = e.changedTouches[0];
    swipeStartRef.current = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0 && hasPrev) onNavigate(index - 1);
    else if (dx < 0 && hasNext) onNavigate(index + 1);
  };

  const iconButton =
    'p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:pointer-events-none';
  const navButton =
    'absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/95 border border-gray-200 text-gray-700 shadow-md hover:bg-white';

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="4xl" variant="viewer">
      <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-gray-100">
        <div className="min-w-0">
          <h2 id={titleId} className="truncate text-sm sm:text-base font-bold text-gray-900">
            {title}
          </h2>
          {photos.length > 1 && (
            <p className="text-xs text-gray-500 tabular-nums">
              {index + 1} de {photos.length}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => onEdit(photo)} aria-label="Editar" title="Editar" className={iconButton}>
            <Pencil className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            onClick={() => runFileAction('download')}
            disabled={busyAction !== null}
            aria-label="Baixar"
            title="Baixar"
            className={iconButton}
          >
            {busyAction === 'download' ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <Download className="w-4.5 h-4.5" />
            )}
          </button>
          {canShareFiles() && (
            <button
              type="button"
              onClick={() => runFileAction('share')}
              disabled={busyAction !== null}
              aria-label="Compartilhar"
              title="Compartilhar"
              className={iconButton}
            >
              {busyAction === 'share' ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Share2 className="w-4.5 h-4.5" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(photo)}
            aria-label={isVideo ? 'Excluir vídeo' : 'Excluir foto'}
            title="Excluir"
            className={`${iconButton} hover:text-danger! hover:bg-danger/10!`}
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-gray-200" />
          <button type="button" onClick={onClose} aria-label="Fechar" className={iconButton}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div
        className="relative flex-1 min-h-0 flex items-center justify-center bg-gray-900"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {isVideo ? (
          <video key={photo.id} src={photo.imageData} controls playsInline className="w-full max-h-[65vh]" />
        ) : (
          <img
            key={photo.id}
            src={photo.imageData}
            alt={photo.caption || 'Foto do programa'}
            draggable={false}
            className="w-full max-h-[65vh] object-contain select-none"
          />
        )}

        {hasPrev && (
          <button
            type="button"
            onClick={() => onNavigate(index - 1)}
            aria-label="Anterior"
            className={`${navButton} left-3`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={() => onNavigate(index + 1)}
            aria-label="Próxima"
            className={`${navButton} right-3`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {(photo.caption || photo.category || photo.takenAt) && (
        <div className="px-5 py-4 space-y-1.5 overflow-y-auto max-h-[20vh]">
          <div className="flex flex-wrap items-center gap-2">
            {photo.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-semibold bg-gray-100 text-gray-700">
                {photo.category}
              </span>
            )}
            {photo.takenAt && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateBR(photo.takenAt)}
              </span>
            )}
          </div>
          {photo.caption && (
            <p className="text-sm text-gray-800 whitespace-pre-wrap wrap-break-word">{photo.caption}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
