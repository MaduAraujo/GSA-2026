import { Calendar, ExternalLink, Loader2, MessageSquareText, Pencil, Share2, Star, Trash2 } from 'lucide-react';
import type { Challenge } from '../../types';
import { formatDateBR } from '../../utils/date';
import { isHttpUrl } from '../../utils/safeUrl';
import { STATUS_STYLES } from './challengeModel';

interface ChallengeCardProps {
  challenge: Challenge;
  isUpdatingStatus: boolean;
  isDeleting: boolean;
  onCycleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function socialLinksOf(challenge: Challenge) {
  if (challenge.socialLinks && challenge.socialLinks.length > 0) return challenge.socialLinks;
  if (challenge.resultLink)
    return [{ id: challenge.id, platform: challenge.resultPlatform, link: challenge.resultLink }];
  return [];
}

export function ChallengeCard({
  challenge,
  isUpdatingStatus,
  isDeleting,
  onCycleStatus,
  onEdit,
  onDelete,
}: ChallengeCardProps) {
  const style = STATUS_STYLES[challenge.status];
  const StatusIcon = style.icon;
  const dates =
    challenge.dates && challenge.dates.length > 0 ? challenge.dates : challenge.deadline ? [challenge.deadline] : [];
  const extraDays = dates.length - 1;

  return (
    <div
      id={`challenge-card-${challenge.id}`}
      className="flex flex-col bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#34A853]/40 transition-all p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {challenge.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700">
              {challenge.category}
            </span>
          )}
          <button
            onClick={onCycleStatus}
            disabled={isUpdatingStatus}
            title="Clique para avançar o status"
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all active:scale-95 ${style.bg} ${style.text}`}
          >
            {isUpdatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <StatusIcon className="w-3 h-3" />}
            <span>{challenge.status}</span>
          </button>
        </div>
      </div>

      <h3 className="font-bold text-gray-900 text-base leading-snug">{challenge.title}</h3>

      {challenge.description && (
        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{challenge.description}</p>
      )}

      {challenge.result && (
        <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-[#34A853]/5 border border-[#34A853]/15">
          <MessageSquareText className="w-3.5 h-3.5 text-[#1E8E3E] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#1E8E3E] uppercase tracking-wider">Resultado</p>
            <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">{challenge.result}</p>
          </div>
        </div>
      )}

      {challenge.resultImage &&
        (challenge.resultMediaType === 'video' ? (
          <video
            src={challenge.resultImage}
            controls
            className="w-full h-32 rounded-xl object-cover border border-gray-200"
          />
        ) : (
          <img
            src={challenge.resultImage}
            alt="Resultado do desafio"
            loading="lazy"
            className="w-full h-32 rounded-xl object-cover border border-gray-200"
          />
        ))}

      {socialLinksOf(challenge)
        .filter((social) => isHttpUrl(social.link))
        .map((social) => (
          <a
            key={social.id}
            href={social.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A73E8] hover:underline"
          >
            <Share2 className="w-3.5 h-3.5" />
            Ver publicação{social.platform ? ` no ${social.platform}` : ''}
          </a>
        ))}

      {isHttpUrl(challenge.externalLink) && (
        <a
          href={challenge.externalLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A73E8] hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver resultado (link externo)
        </a>
      )}

      <div className="flex-1" />

      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 pt-1">
        {dates.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDateBR(dates[0])}
            {extraDays > 0 ? ` +${extraDays} dia${extraDays > 1 ? 's' : ''}` : ''}
          </span>
        )}
        {typeof challenge.points === 'number' && (
          <span className="inline-flex items-center gap-1 font-semibold text-[#9E5D00]">
            <Star className="w-3.5 h-3.5 fill-[#FBBC04] text-[#FBBC04]" />
            {challenge.points} pts
          </span>
        )}
        {isHttpUrl(challenge.link) && (
          <a
            href={challenge.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#1A73E8] hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Detalhes
          </a>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-1.5">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-xl bg-gray-100 hover:bg-[#34A853]/10 hover:text-[#1E8E3E] text-gray-600 transition-all"
          aria-label="Editar desafio"
          title="Editar Desafio"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1.5 rounded-xl bg-gray-100 hover:bg-[#EA4335]/10 hover:text-[#EA4335] text-gray-600 transition-all disabled:opacity-50"
          aria-label="Excluir desafio"
          title="Excluir Desafio"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
