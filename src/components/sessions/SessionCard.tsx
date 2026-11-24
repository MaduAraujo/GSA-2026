import { Camera, Copy, Paperclip, Pencil, Play, Trash2 } from 'lucide-react';
import type { AmbassadorSession } from '../../types';
import { formatDateBR } from '../../utils/date';
import { normalizeSearch } from '../../utils/search';
import { ActionMenu } from '../ActionMenu';
import { splitAttachments } from './sessionFiles';
import { formatMinutes, parseTools } from './sessionView';

interface SessionCardProps {
  session: AmbassadorSession;
  activeTool?: string;
  onOpen: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddProof: () => void;
  onToolClick: (tool: string) => void;
}

const MAX_CARD_TOOLS = 4;

export function SessionCard({
  session,
  activeTool,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
  onAddProof,
  onToolClick,
}: SessionCardProps) {
  const { images, documents } = splitAttachments(session.challengeFiles);
  const tools = parseTools(session.toolLearned);
  const hiddenTools = tools.length - MAX_CARD_TOOLS;
  const activeKey = activeTool ? normalizeSearch(activeTool) : '';

  const meta = [
    formatDateBR(session.date),
    session.durationMinutes ? formatMinutes(session.durationMinutes) : null,
    session.score ? `${session.score} pts` : null,
    session.pastSessionId ? 'Acervo' : null,
  ].filter(Boolean) as string[];

  return (
    <article
      id={`session-card-${session.id}`}
      className="group/card relative w-full bg-white rounded-2xl border border-gray-200 hover:border-primary/40 focus-within:border-primary/40 transition-colors p-4 flex gap-4"
    >
      {session.proofImage && (
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          {session.proofMediaType === 'video' ? (
            <>
              <video
                src={session.proofImage}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center">
                  <Play aria-hidden="true" className="w-3.5 h-3.5 ml-0.5 fill-current" />
                  <span className="sr-only">Vídeo</span>
                </span>
              </span>
            </>
          ) : (
            <img src={session.proofImage} alt="" loading="lazy" className="w-full h-full object-cover" />
          )}
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2">
            <button
              type="button"
              onClick={onOpen}
              className="text-left hover:text-primary focus:outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-primary/40"
            >
              {session.title}
            </button>
          </h3>
          <div className="relative z-10 -mt-1 -mr-2 shrink-0">
            <ActionMenu
              label={`Ações de ${session.title}`}
              items={[
                { label: 'Editar', icon: Pencil, onSelect: onEdit },
                ...(session.proofImage ? [] : [{ label: 'Adicionar comprovação', icon: Camera, onSelect: onAddProof }]),
                { label: 'Duplicar', icon: Copy, onSelect: onDuplicate },
                { label: 'Excluir', icon: Trash2, onSelect: onDelete, tone: 'danger' as const },
              ]}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500" title={session.pastSessionId ? 'Encontro oficial do Acervo' : undefined}>
          {meta.join(' · ')}
        </p>

        {session.challenge && <p className="text-xs text-gray-500 line-clamp-1">Desafio: {session.challenge}</p>}

        {(images.length > 0 || documents.length > 0) && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {images.slice(0, 3).map((file) => (
              <img
                key={file.id}
                src={file.dataUrl}
                alt={file.name}
                loading="lazy"
                className="w-7 h-7 rounded-md object-cover border border-gray-200"
              />
            ))}
            {images.length > 3 && <span className="text-2xs text-gray-400">+{images.length - 3}</span>}
            {documents.length > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Paperclip aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                {documents.length} arquivo{documents.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {tools.length > 0 && (
          <div className="relative z-10 flex flex-wrap gap-1.5 w-fit pt-0.5">
            {tools.slice(0, MAX_CARD_TOOLS).map((tool) => {
              const active = normalizeSearch(tool) === activeKey;
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => onToolClick(tool)}
                  aria-pressed={active}
                  title={active ? 'Remover filtro' : `Ver tudo com ${tool}`}
                  className={`px-2 py-0.5 rounded-md text-2xs font-medium transition-colors ${
                    active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tool}
                </button>
              );
            })}
            {hiddenTools > 0 && <span className="text-2xs text-gray-400 self-center">+{hiddenTools}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
