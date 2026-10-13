import { Calendar, Flag, ImageOff, Paperclip, Star, Wrench } from 'lucide-react';
import type { AmbassadorSession } from '../../types';
import { formatDateBR } from '../../utils/date';
import { splitAttachments } from './sessionFiles';

export function SessionCard({ session, onOpen }: { session: AmbassadorSession; onOpen: () => void }) {
  const { images, documents } = splitAttachments(session.challengeFiles);

  return (
    <button
      type="button"
      id={`session-card-${session.id}`}
      onClick={onOpen}
      className="w-full text-left bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#34A853]/50 transition-all p-6 flex gap-4 cursor-pointer"
    >
      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
        {session.proofImage ? (
          session.proofMediaType === 'video' ? (
            <video
              src={session.proofImage}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img src={session.proofImage} alt={session.title} loading="lazy" className="w-full h-full object-cover" />
          )
        ) : (
          <ImageOff className="w-6 h-6 text-gray-300" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-gray-900 leading-snug truncate">{session.title}</h3>
          <span className="text-xs text-gray-400 font-medium shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDateBR(session.date)}
          </span>
        </div>

        {session.challenge && (
          <p className="text-xs text-gray-600 flex items-start gap-1.5">
            <Flag className="w-3.5 h-3.5 text-[#FBBC04] shrink-0 mt-0.5" />
            <span className="line-clamp-1">{session.challenge}</span>
          </p>
        )}

        {(images.length > 0 || documents.length > 0) && (
          <div className="flex items-center gap-1.5">
            {images.slice(0, 3).map((file) => (
              <img
                key={file.id}
                src={file.dataUrl}
                alt={file.name}
                loading="lazy"
                className="w-8 h-8 rounded-lg object-cover border border-gray-200"
              />
            ))}
            {images.length > 3 && <span className="text-[10px] text-gray-400 font-semibold">+{images.length - 3}</span>}
            {documents.length > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5 text-[#34A853] shrink-0" />
                {documents.length} arquivo{documents.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-gray-600 flex items-start gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-[#1A73E8] shrink-0 mt-0.5" />
          <span className="line-clamp-1">{session.toolLearned || 'Nenhuma ferramenta registrada'}</span>
        </p>

        {session.score ? (
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#FBBC04] shrink-0" />
            <span>{session.score}</span>
          </p>
        ) : null}
      </div>
    </button>
  );
}
