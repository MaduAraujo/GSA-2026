import { BadgeCheck, ChevronDown, FileText, Globe, Loader2, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useUndoableDelete } from '../../hooks/useUndoableDelete';
import type { EarnedBadge } from '../../types';
import { badgeDisplayName, formatBadgeAddedAt, isBadgeImage } from './badgeFiles';
import { BadgeViewerModal } from './BadgeViewerModal';

const MAX_BADGE_SIZE_BYTES = 50 * 1024 * 1024;
const BADGE_ACCEPT = 'image/*,.pdf';
const PROGRESS_MIN_BYTES = 2 * 1024 * 1024;
const LARGE_FILE_BYTES = 40 * 1024 * 1024;

const toMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

interface UploadProgressOptions {
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}

interface UploadProgress {
  fileName: string;
  fileIndex: number;
  fileCount: number;
  loaded: number;
  total: number;
  hasLargeFile: boolean;
}

interface EarnedBadgesSectionProps {
  badges: EarnedBadge[];
  isLoading: boolean;
  onUpload: (file: File, progress?: UploadProgressOptions) => Promise<void>;
  onDelete: (badge: EarnedBadge) => Promise<void>;
  onToggleFavorite: (badge: EarnedBadge, isFavorite: boolean) => Promise<void>;
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
}

const COLLAPSED_PREVIEW_COUNT = 5;

export const EarnedBadgesSection: React.FC<EarnedBadgesSectionProps> = ({
  badges: savedBadges,
  isLoading,
  onUpload,
  onDelete,
  onToggleFavorite,
  isExpanded: isExpandedProp,
  onExpandedChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const pendingDelete = useUndoableDelete<EarnedBadge>({
    commit: onDelete,
    message: 'Badge removido',
    errorMessage: 'Não foi possível remover o badge. Ele foi restaurado.',
  });
  const badges = savedBadges.filter((b) => !pendingDelete.pendingIds.has(b.id));
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [storedExpanded, setStoredExpanded] = usePersistedState('gsa_badges_expanded', false);
  const isExpanded = isExpandedProp ?? storedExpanded;
  const setIsExpanded = onExpandedChange ?? setStoredExpanded;
  const viewingIndex = viewingId ? badges.findIndex((b) => b.id === viewingId) : -1;

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setError(null);
    const tooBig = files.find((f) => f.size > MAX_BADGE_SIZE_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" é muito grande (${(tooBig.size / (1024 * 1024)).toFixed(1)}MB). O limite é 50MB.`);
      return;
    }
    const unsupported = files.find((f) => !isBadgeImage(f.name) && !/\.pdf$/i.test(f.name));
    if (unsupported) {
      setError(`"${unsupported.name}" não é suportado. Envie uma imagem ou PDF.`);
      return;
    }

    const total = files.reduce((sum, f) => sum + f.size, 0);
    const controller = new AbortController();
    const showProgress = total >= PROGRESS_MIN_BYTES;
    abortRef.current = controller;
    setIsUploading(true);
    setIsExpanded(true);
    try {
      let done = 0;
      for (const [i, file] of files.entries()) {
        const update = (loaded: number) =>
          setProgress({
            fileName: file.name,
            fileIndex: i,
            fileCount: files.length,
            loaded: done + loaded,
            total,
            hasLargeFile: files.some((f) => f.size >= LARGE_FILE_BYTES),
          });
        if (showProgress) {
          update(0);
          await onUpload(file, { onProgress: update, signal: controller.signal });
        } else {
          await onUpload(file);
        }
        done += file.size;
      }
    } catch {
      if (!controller.signal.aborted) setError('Não foi possível anexar o badge. Tente novamente.');
    } finally {
      abortRef.current = null;
      setProgress(null);
      setIsUploading(false);
    }
  };

  const cancelUpload = () => abortRef.current?.abort();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    void uploadFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading || isLoading) return;
    void uploadFiles(Array.from(e.dataTransfer.files));
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false);
  };

  const handleDelete = (badge: EarnedBadge) => {
    setError(null);
    const index = badges.findIndex((b) => b.id === badge.id);
    const neighbor = badges[index + 1] ?? badges[index - 1];
    if (viewingId === badge.id) setViewingId(neighbor?.id ?? null);
    pendingDelete.remove(badge);
  };

  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const isFavorite = (badge: EarnedBadge) => favoriteOverrides[badge.id] ?? badge.isFavorite;

  const handleToggleFavorite = async (badge: EarnedBadge) => {
    const next = !isFavorite(badge);
    setError(null);
    setFavoriteOverrides((o) => ({ ...o, [badge.id]: next }));
    try {
      await onToggleFavorite(badge, next);
    } catch {
      setError('Não foi possível atualizar o destaque do badge. Tente novamente.');
    } finally {
      setFavoriteOverrides(({ [badge.id]: _, ...rest }) => rest);
    }
  };

  const openPicker = () => inputRef.current?.click();
  const isBusy = isUploading || isLoading;

  return (
    <section
      id="earned-badges"
      aria-labelledby="earned-badges-heading"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-white rounded-2xl border shadow-sm p-4 sm:p-5 transition-colors ${
        isDragging ? 'border-primary ring-4 ring-primary/10' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="earned-badges-content"
          title={isExpanded ? 'Recolher badges' : 'Expandir badges'}
          className="flex flex-1 items-center gap-3 min-w-0 text-left rounded-xl -m-1 p-1 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="earned-badges-heading" className="text-base font-bold text-gray-900">
              Badges
            </h3>
          </div>
          <ChevronDown
            aria-hidden="true"
            className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={BADGE_ACCEPT}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Arquivos dos badges"
        />
        {badges.length > 0 && (
          <button
            type="button"
            onClick={openPicker}
            disabled={isBusy}
            aria-label={isUploading ? 'Enviando...' : 'Anexar badge'}
            title="Anexar badge"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 disabled:opacity-60 disabled:cursor-wait"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">{isUploading ? 'Enviando...' : 'Adicionar'}</span>
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger/5 px-3 py-2 text-xs font-medium text-danger-700">
          {error}
        </p>
      )}

      {progress && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/4 px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-800">
                Enviando {progress.fileName}
                {progress.fileCount > 1 && (
                  <span className="font-medium text-gray-500">
                    {' '}
                    ({progress.fileIndex + 1} de {progress.fileCount})
                  </span>
                )}
              </p>
              <p className="text-2xs text-gray-500 tabular-nums">
                {toMB(progress.loaded)} de {toMB(progress.total)} MB
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-primary tabular-nums">
                {Math.round((progress.loaded / progress.total) * 100)}%
              </span>
              <button
                type="button"
                onClick={cancelUpload}
                aria-label="Cancelar envio"
                title="Cancelar envio"
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            role="progressbar"
            aria-label="Progresso do envio"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((progress.loaded / progress.total) * 100)}
            className="mt-2 h-1.5 w-full rounded-full bg-primary/15 overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${(progress.loaded / progress.total) * 100}%` }}
            />
          </div>
          {progress.hasLargeFile && (
            <p className="mt-2 text-2xs text-gray-500">
              Arquivo grande, perto do limite de 50MB. Mantenha esta aba aberta até o envio terminar.
            </p>
          )}
        </div>
      )}

      {!isExpanded && !progress && badges.length > 0 && (
        <ul aria-label="Prévia dos badges" className="mt-4 flex flex-wrap items-center gap-2">
          {[...badges]
            .sort((a, b) => Number(isFavorite(b)) - Number(isFavorite(a)))
            .slice(0, COLLAPSED_PREVIEW_COUNT)
            .map((badge) => {
              const name = badgeDisplayName(badge.fileName);
              return (
                <li key={badge.id}>
                  <button
                    type="button"
                    onClick={() => setViewingId(badge.id)}
                    aria-label={`Visualizar badge ${name}`}
                    title={name}
                    className="w-12 h-12 rounded-xl border border-gray-200 bg-surface-muted p-1.5 flex items-center justify-center hover:border-primary/50 hover:shadow-sm transition-all cursor-zoom-in focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {badge.url && isBadgeImage(badge.fileName) ? (
                      <img src={badge.url} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <FileText aria-hidden="true" className="w-5 h-5 text-danger" />
                    )}
                  </button>
                </li>
              );
            })}
          {badges.length > COLLAPSED_PREVIEW_COUNT && (
            <li>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                aria-label={`Ver todos os ${badges.length} badges`}
                className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 tabular-nums transition-colors"
              >
                +{badges.length - COLLAPSED_PREVIEW_COUNT}
              </button>
            </li>
          )}
        </ul>
      )}

      {isExpanded && (
        <div id="earned-badges-content">
          {isLoading && badges.length === 0 && (
            <ul aria-hidden="true" className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-3 space-y-1.5">
                    <div className="h-2.5 w-3/4 rounded bg-gray-100" />
                    <div className="h-2 w-1/2 rounded bg-gray-100" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && !progress && badges.length === 0 && (
            <button
              type="button"
              onClick={openPicker}
              disabled={isUploading}
              className={`mt-5 w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors disabled:cursor-wait ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/50 hover:bg-surface-muted'
              }`}
            >
              <span className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {isUploading ? 'Enviando...' : 'Nenhum badge anexado ainda'}
              </span>
              <span className="text-xs text-gray-500">
                Clique ou arraste arquivos aqui · PNG, JPG, SVG ou PDF até 50MB
              </span>
            </button>
          )}

          {badges.length > 0 && (
            <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {badges.map((badge) => {
                const name = badgeDisplayName(badge.fileName);
                const addedAt = formatBadgeAddedAt(badge.createdAt);
                const favorite = isFavorite(badge);
                return (
                  <li
                    key={badge.id}
                    className={`group relative rounded-xl border bg-white overflow-hidden transition-all hover:shadow-md ${
                      favorite ? 'border-primary/50 ring-1 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setViewingId(badge.id)}
                      aria-label={`Visualizar badge ${name}`}
                      title={badge.fileName}
                      className="block w-full text-left cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary rounded-xl"
                    >
                      <div className="aspect-square flex items-center justify-center p-5 bg-surface-muted">
                        {badge.url && isBadgeImage(badge.fileName) ? (
                          <img
                            src={badge.url}
                            alt={name}
                            loading="lazy"
                            className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <FileText aria-hidden="true" className="w-10 h-10 text-danger" />
                            <span className="text-2xs font-bold tracking-wider text-gray-400">PDF</span>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-gray-100 px-3 py-2.5">
                        <p className="truncate text-xs font-semibold text-gray-800">{name}</p>
                        {addedAt && <p className="text-2xs text-gray-500">{addedAt}</p>}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(badge)}
                      aria-pressed={favorite}
                      aria-label={`Destacar ${name} no portfólio público`}
                      title={favorite ? 'Remover do portfólio público' : 'Destacar no portfólio público'}
                      className={`absolute top-2 left-2 p-1.5 rounded-lg border shadow-xs transition-all ${
                        favorite
                          ? 'bg-primary-50 border-primary/40 text-primary'
                          : 'bg-white/95 border-gray-200 text-gray-400 hover:text-primary sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(badge)}
                      aria-label={`Remover badge ${badge.fileName}`}
                      title="Remover badge"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/95 border border-gray-200 text-gray-500 hover:text-danger hover:border-danger/30 shadow-xs transition-all sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {isDragging && badges.length > 0 && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/5 flex items-center justify-center">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow-md">
            Solte para anexar
          </span>
        </div>
      )}

      {viewingIndex >= 0 && (
        <BadgeViewerModal
          badges={badges}
          index={viewingIndex}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          onNavigate={(i) => setViewingId(badges[i]?.id ?? null)}
          onDelete={handleDelete}
          onClose={() => setViewingId(null)}
        />
      )}
    </section>
  );
};
