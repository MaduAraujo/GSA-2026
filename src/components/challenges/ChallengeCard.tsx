import { Calendar, ExternalLink, Loader2, MessageSquareText, Music, Pencil, Share2, Star, Trash2 } from 'lucide-react';
import type { Challenge } from '../../types';
import { ActionMenu } from '../ActionMenu';
import { formatDateBR } from '../../utils/date';
import { isHttpUrl } from '../../utils/safeUrl';
import { STATUS_STYLES } from './challengeModel';

interface ChallengeCardProps {
  challenge: Challenge;
  isUpdatingStatus: boolean;
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

export function ChallengeCard({ challenge, isUpdatingStatus, onCycleStatus, onEdit, onDelete }: ChallengeCardProps) {
  const style = STATUS_STYLES[challenge.status];
  const StatusIcon = style.icon;
  const dates =
    challenge.dates && challenge.dates.length > 0 ? challenge.dates : challenge.deadline ? [challenge.deadline] : [];
  const extraDays = dates.length - 1;
  const media = (challenge.media ?? []).filter((item) => item.url);
  const visualMedia = media.filter((item) => item.kind !== 'audio');
  const audioMedia = media.filter((item) => item.kind === 'audio');

  return (
    <div
      id={`challenge-card-${challenge.id}`}
      className="flex flex-col bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-primary/40 transition-all p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {challenge.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-semibold bg-gray-100 text-gray-700">
              {challenge.category}
            </span>
          )}
          <button
            onClick={onCycleStatus}
            disabled={isUpdatingStatus}
            title="Clique para avançar o status"
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold transition-all active:scale-95 ${style.bg} ${style.text}`}
          >
            {isUpdatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <StatusIcon className="w-3 h-3" />}
            <span>{challenge.status}</span>
          </button>
        </div>
        <ActionMenu
          label={`Mais ações para ${challenge.title}`}
          items={[
            { label: 'Editar', icon: Pencil, onSelect: onEdit },
            { label: 'Excluir', icon: Trash2, onSelect: onDelete, tone: 'danger' },
          ]}
        />
      </div>

      <h3 className="font-bold text-gray-900 text-base leading-snug">{challenge.title}</h3>

      {challenge.description && (
        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{challenge.description}</p>
      )}

      {challenge.result && (
        <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-success/5 border border-success/15">
          <MessageSquareText className="w-3.5 h-3.5 text-success-700 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-2xs font-semibold text-success-700">Resultado</p>
            <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">{challenge.result}</p>
          </div>
        </div>
      )}

      {visualMedia.length > 0 && (
        <div className={visualMedia.length > 1 ? 'grid grid-cols-3 gap-1.5' : ''}>
          {visualMedia.map((item) => {
            const mediaClass = `w-full ${visualMedia.length > 1 ? 'h-20' : 'h-32'} rounded-xl object-cover border border-gray-200`;
            return item.kind === 'video' ? (
              <video key={item.id} src={item.url} controls className={mediaClass} />
            ) : (
              <img key={item.id} src={item.url} alt={item.name} loading="lazy" className={mediaClass} />
            );
          })}
        </div>
      )}

      {audioMedia.map((item) => (
        <div key={item.id} className="space-y-1">
          <p className="inline-flex items-center gap-1.5 text-2xs font-semibold text-gray-600 max-w-full">
            <Music className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{item.name}</span>
          </p>
          <audio src={item.url} controls preload="none" className="w-full h-9" />
        </div>
      ))}

      {socialLinksOf(challenge)
        .filter((social) => isHttpUrl(social.link))
        .map((social) => (
          <a
            key={social.id}
            href={social.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
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
          <span className="inline-flex items-center gap-1 font-semibold text-warning-800">
            <Star className="w-3.5 h-3.5 fill-warning text-warning" />
            {challenge.points} pts
          </span>
        )}
        {isHttpUrl(challenge.link) && (
          <a
            href={challenge.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Detalhes
          </a>
        )}
      </div>
    </div>
  );
}
