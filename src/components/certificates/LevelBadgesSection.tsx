import { BadgeCheck, FileText, Loader2, Paperclip, Trash2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import type { LevelBadge } from '../../types';

const MAX_BADGE_SIZE_BYTES = 50 * 1024 * 1024;
const BADGE_ACCEPT = 'image/*,.pdf';

interface LevelBadgesSectionProps {
  level: number;
  badges: LevelBadge[];
  isLoading: boolean;
  onUpload: (level: number, file: File) => Promise<void>;
  onDelete: (badge: LevelBadge) => Promise<void>;
}

const isImage = (fileName: string) => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(fileName);

export const LevelBadgesSection: React.FC<LevelBadgesSectionProps> = ({
  level,
  badges,
  isLoading,
  onUpload,
  onDelete,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const levelBadges = badges.filter((b) => b.level === level);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    setError(null);
    const tooBig = files.find((f) => f.size > MAX_BADGE_SIZE_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" é muito grande (${(tooBig.size / (1024 * 1024)).toFixed(1)}MB). O limite é 50MB.`);
      return;
    }

    setIsUploading(true);
    try {
      for (const file of files) await onUpload(level, file);
    } catch {
      setError('Não foi possível anexar o badge. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (badge: LevelBadge) => {
    if (!confirm('Deseja realmente remover este badge?')) return;
    setError(null);
    setDeletingId(badge.id);
    try {
      await onDelete(badge);
    } catch {
      setError('Não foi possível remover o badge. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      aria-labelledby="level-badges-heading"
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center shrink-0">
            <BadgeCheck className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h3 id="level-badges-heading" className="text-sm font-bold text-gray-900">
              Badges do Nível {level}
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              Anexe os badges que você conquistou ao avançar para o Nível {level}
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={BADGE_ACCEPT}
          onChange={handleFileChange}
          className="hidden"
          aria-label={`Arquivos dos badges do Nível ${level}`}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || isLoading}
          aria-label={isUploading ? 'Enviando...' : 'Anexar badge'}
          title="Anexar badge"
          className="inline-flex shrink-0 items-center justify-center gap-2 px-2.5 sm:px-4 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1765CC] text-white font-semibold text-sm shadow-xs transition-all active:scale-95 disabled:opacity-60 disabled:cursor-wait"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          <span className="hidden sm:inline">{isUploading ? 'Enviando...' : 'Anexar badge'}</span>
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-[#EA4335]">
          {error}
        </p>
      )}

      {!isLoading && levelBadges.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
          Nenhum badge anexado ainda.
        </p>
      )}

      {levelBadges.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {levelBadges.map((badge) => (
            <li
              key={badge.id}
              className="group relative rounded-xl border border-gray-200 bg-[#F8FAFD] overflow-hidden"
            >
              <a
                href={badge.url}
                target="_blank"
                rel="noopener noreferrer"
                title={badge.fileName}
                className="block focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
              >
                <div className="aspect-square flex items-center justify-center p-3">
                  {badge.url && isImage(badge.fileName) ? (
                    <img src={badge.url} alt={badge.fileName} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <FileText aria-hidden="true" className="w-10 h-10 text-[#EA4335]" />
                  )}
                </div>
                <p className="truncate border-t border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">
                  {badge.fileName}
                </p>
              </a>
              <button
                type="button"
                onClick={() => handleDelete(badge)}
                disabled={deletingId === badge.id}
                aria-label={`Remover badge ${badge.fileName}`}
                title="Remover badge"
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 border border-gray-200 text-gray-500 hover:text-[#EA4335] shadow-xs transition-colors disabled:opacity-60"
              >
                {deletingId === badge.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
