import { Calendar, ImageOff, PlayCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import type { GalleryPhoto } from '../../types';
import { formatDateBR } from '../../utils/date';
import { ActionMenu, type ActionMenuItem } from '../ActionMenu';
import { formatDuration } from './galleryMedia';

interface GalleryCardProps {
  photo: GalleryPhoto;
  actions: ActionMenuItem[];
  onOpen: () => void;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function GalleryCard({ photo, actions, onOpen }: GalleryCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const isVideo = photo.mediaType === 'video';
  const label = photo.caption || (isVideo ? 'Vídeo sem legenda' : 'Foto sem legenda');

  const startPreview = () => {
    if (!isVideo || prefersReducedMotion()) return;
    videoRef.current?.play().catch(() => {});
  };
  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  const mediaClass = `block w-full transition-transform duration-300 group-hover:scale-[1.03] ${
    isLoaded ? 'h-auto max-h-96 object-cover' : 'aspect-4/3 object-cover opacity-0'
  }`;

  return (
    <div className="group relative mb-4 break-inside-avoid bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-primary/40 transition-all overflow-hidden">
      <button
        type="button"
        id={`gallery-photo-${photo.id}`}
        onClick={onOpen}
        onMouseEnter={startPreview}
        onMouseLeave={stopPreview}
        onFocus={startPreview}
        onBlur={stopPreview}
        aria-label={`Abrir ${label}`}
        className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-danger"
      >
        <div className={`relative overflow-hidden bg-gray-100 ${isLoaded || hasFailed ? '' : 'animate-pulse'}`}>
          {hasFailed ? (
            <div className="aspect-4/3 flex flex-col items-center justify-center gap-1.5 text-gray-400">
              <ImageOff className="w-7 h-7" />
              <span className="text-2xs font-medium">Não foi possível carregar</span>
            </div>
          ) : isVideo ? (
            <>
              <video
                ref={videoRef}
                src={`${photo.imageData}#t=0.1`}
                className={mediaClass}
                muted
                loop
                playsInline
                preload="metadata"
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration);
                  setIsLoaded(true);
                }}
                onError={() => setHasFailed(true)}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-transparent pointer-events-none transition-colors">
                <PlayCircle className="w-9 h-9 text-white drop-shadow group-hover:opacity-0 transition-opacity" />
              </div>
              {duration !== null && formatDuration(duration) && (
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-2xs font-bold bg-black/70 text-white tabular-nums">
                  {formatDuration(duration)}
                </span>
              )}
            </>
          ) : (
            <img
              src={photo.imageData}
              alt={photo.caption || 'Foto do programa'}
              loading="lazy"
              decoding="async"
              className={mediaClass}
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasFailed(true)}
            />
          )}
          {photo.category && (
            <span className="absolute top-2 left-2 max-w-[70%] truncate px-2 py-0.5 rounded-md text-2xs font-bold bg-black/60 text-white">
              {photo.category}
            </span>
          )}
        </div>
        {(photo.caption || photo.takenAt) && (
          <div className="p-2.5 space-y-0.5">
            {photo.caption && <p className="text-xs font-semibold text-gray-800 line-clamp-2">{photo.caption}</p>}
            {photo.takenAt && (
              <p className="text-2xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDateBR(photo.takenAt)}
              </p>
            )}
          </div>
        )}
      </button>

      <div className="absolute top-2 right-2 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <ActionMenu
          items={actions}
          label={`Mais ações para ${label}`}
          buttonClassName="p-1.5 rounded-lg bg-white/90 text-gray-700 shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-primary"
        />
      </div>
    </div>
  );
}
