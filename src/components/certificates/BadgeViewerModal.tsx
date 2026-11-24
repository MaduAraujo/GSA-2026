import {
  Globe,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Maximize2,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import React, { useEffect, useRef, useState } from 'react';
import type { EarnedBadge } from '../../types';
import { badgeDisplayName, formatBadgeAddedAt, isBadgeImage } from './badgeFiles';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

interface BadgeViewerModalProps {
  badges: EarnedBadge[];
  index: number;
  isFavorite: (badge: EarnedBadge) => boolean;
  onToggleFavorite: (badge: EarnedBadge) => void;
  onNavigate: (index: number) => void;
  onDelete: (badge: EarnedBadge) => void;
  onClose: () => void;
}

export function BadgeViewerModal({
  badges,
  index,
  isFavorite,
  onToggleFavorite,
  onNavigate,
  onDelete,
  onClose,
}: BadgeViewerModalProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [isPanning, setIsPanning] = useState(false);

  const badge = badges[index];
  const hasPrev = index > 0;
  const hasNext = index < badges.length - 1;
  const showsImage = !!badge?.url && isBadgeImage(badge.fileName);

  const [zoomKey, setZoomKey] = useState(badge?.id);
  if (badge?.id !== zoomKey) {
    setZoomKey(badge?.id);
    setZoom(MIN_ZOOM);
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('iframe, input, textarea')) return;
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(index - 1);
      else if (e.key === 'ArrowRight' && hasNext) onNavigate(index + 1);
      else if (!showsImage) return;
      else if (e.key === '+' || e.key === '=') setZoom((z) => clampZoom(z + ZOOM_STEP));
      else if (e.key === '-') setZoom((z) => clampZoom(z - ZOOM_STEP));
      else if (e.key === '0') setZoom(MIN_ZOOM);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [index, hasPrev, hasNext, showsImage, onNavigate]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !showsImage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => clampZoom(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [showsImage]);

  if (!badge) return null;

  const name = badgeDisplayName(badge.fileName);
  const addedAt = formatBadgeAddedAt(badge.createdAt);
  const isZoomed = zoom > MIN_ZOOM;
  const favorite = isFavorite(badge);

  const startPan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isZoomed || e.button !== 0) return;
    const stage = e.currentTarget;
    dragRef.current = { x: e.clientX, y: e.clientY, left: stage.scrollLeft, top: stage.scrollTop };
    stage.setPointerCapture(e.pointerId);
    setIsPanning(true);
  };

  const movePan = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    e.currentTarget.scrollLeft = drag.left - (e.clientX - drag.x);
    e.currentTarget.scrollTop = drag.top - (e.clientY - drag.y);
  };

  const endPan = () => {
    dragRef.current = null;
    setIsPanning(false);
  };

  const iconButton =
    'p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:pointer-events-none';

  return (
    <Modal onClose={onClose} label={name} size="5xl" variant="viewer" className="h-[min(90vh,52rem)]">
      <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-gray-100">
        <div className="min-w-0">
          <h2 className="truncate text-sm sm:text-base font-bold text-gray-900">{name}</h2>
          <p className="text-xs text-gray-500">
            {addedAt && <>Adicionado em {addedAt}</>}
            {badges.length > 1 && (
              <span className="tabular-nums">
                {addedAt && ' · '}
                {index + 1} de {badges.length}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onToggleFavorite(badge)}
            aria-pressed={favorite}
            aria-label="Destacar no portfólio público"
            title={favorite ? 'Remover do portfólio público' : 'Destacar no portfólio público'}
            className={`${iconButton} ${favorite ? 'text-primary! bg-primary-50!' : ''}`}
          >
            <Globe className="w-4.5 h-4.5" />
          </button>
          <a href={badge.url} download={badge.fileName} aria-label="Baixar badge" title="Baixar" className={iconButton}>
            <Download className="w-4.5 h-4.5" />
          </a>
          <a
            href={badge.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir em nova aba"
            title="Abrir em nova aba"
            className={`${iconButton} hidden sm:inline-flex`}
          >
            <ExternalLink className="w-4.5 h-4.5" />
          </a>
          <button
            type="button"
            onClick={() => onDelete(badge)}
            aria-label={`Remover badge ${badge.fileName}`}
            title="Remover badge"
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

      <div className="relative flex-1 min-h-0 bg-gray-100">
        {showsImage ? (
          <div
            ref={stageRef}
            data-testid="badge-stage"
            onPointerDown={startPan}
            onPointerMove={movePan}
            onPointerUp={endPan}
            onPointerCancel={endPan}
            onDoubleClick={() => setZoom((z) => (z > MIN_ZOOM ? MIN_ZOOM : 2))}
            className={`absolute inset-0 flex overflow-auto p-6 select-none ${
              isZoomed ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
            }`}
          >
            <img
              src={badge.url}
              alt={name}
              draggable={false}
              style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
              className="m-auto shrink-0 object-contain drop-shadow-md transition-[width,height] duration-150"
            />
          </div>
        ) : (
          <iframe src={badge.url} title={name} className="absolute inset-0 w-full h-full bg-white" />
        )}

        {hasPrev && (
          <button
            type="button"
            onClick={() => onNavigate(index - 1)}
            aria-label="Badge anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/95 border border-gray-200 text-gray-700 shadow-md hover:bg-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={() => onNavigate(index + 1)}
            aria-label="Próximo badge"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/95 border border-gray-200 text-gray-700 shadow-md hover:bg-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {showsImage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-2xl bg-white/95 border border-gray-200 p-1 shadow-lg">
            <button
              type="button"
              onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Diminuir zoom"
              className={iconButton}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span aria-live="polite" className="w-12 text-center text-xs font-semibold text-gray-700 tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Aumentar zoom"
              className={iconButton}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-gray-200" />
            <button
              type="button"
              onClick={() => setZoom(MIN_ZOOM)}
              disabled={!isZoomed}
              aria-label="Ajustar à tela"
              title="Ajustar à tela"
              className={iconButton}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
