import { Check, ChevronDown, Copy, CopyPlus, Link2, Pencil, Play, Star, Trash2, Wand2 } from 'lucide-react';
import { useId, useState } from 'react';
import type { PromptItem } from '../../types';
import { formatRelativePtBR } from '../../utils/date';
import { ActionMenu } from '../ActionMenu';
import { getPromptVariables } from './fillPromptVariables';

const CLAMP_CHARS = 240;
const CLAMP_LINES = 4;

const SECTION_STYLES: Record<string, string> = {
  Estudos: 'bg-primary/10 text-primary border border-primary/20',
  'Workshops & Eventos': 'bg-success/10 text-success-800 border border-success/20',
  'Criação de Conteúdo': 'bg-danger/10 text-danger-600 border border-danger/20',
  'Carreira Tech': 'bg-warning/20 text-warning-900 border border-warning/30',
};

interface PromptCardProps {
  prompt: PromptItem;
  isCopied: boolean;
  onToggleFavorite: () => void;
  onTest: () => void;
  onEnhance: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onDuplicate: () => void;
}

function usageLabel(prompt: PromptItem): string | null {
  const count = prompt.usageCount || 0;
  if (count === 0) return null;
  const when = prompt.lastUsed ? formatRelativePtBR(prompt.lastUsed) : '';
  return `Usado ${count}x${when ? ` · ${when}` : ''}`;
}

export function PromptCard({
  prompt,
  isCopied,
  onToggleFavorite,
  onTest,
  onEnhance,
  onEdit,
  onDelete,
  onCopy,
  onDuplicate,
}: PromptCardProps) {
  const variables = getPromptVariables(prompt);
  const section = prompt.section.trim();
  const usage = usageLabel(prompt);
  const [isExpanded, setIsExpanded] = useState(false);
  const textId = useId();
  const isLong = prompt.promptText.length > CLAMP_CHARS || prompt.promptText.split('\n').length > CLAMP_LINES;

  return (
    <div
      id={`prompt-card-${prompt.id}`}
      className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-primary/40 transition-all p-6 flex flex-col justify-between space-y-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          {section && (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                SECTION_STYLES[section] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {section}
            </span>
          )}

          <div className="flex items-center gap-1 ml-auto">
            {usage && <span className="text-2xs text-gray-600">{usage}</span>}
            <button
              onClick={onToggleFavorite}
              aria-label={prompt.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              aria-pressed={!!prompt.isFavorite}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors"
            >
              <Star className={`w-4 h-4 ${prompt.isFavorite ? 'fill-warning text-warning' : ''}`} />
            </button>
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">{prompt.title}</h3>

        <div className="relative group bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p
            id={textId}
            className={`text-xs sm:text-sm text-gray-700 font-mono whitespace-pre-wrap leading-relaxed ${
              isExpanded ? 'max-h-96 overflow-y-auto' : 'line-clamp-4'
            }`}
          >
            {prompt.promptText}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              aria-expanded={isExpanded}
              aria-controls={textId}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>{isExpanded ? 'Ver menos' : 'Ver mais'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {prompt.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium bg-gray-100 text-gray-600"
            >
              #{tag}
            </span>
          ))}

          {variables.map((v) => (
            <span
              key={v}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-semibold bg-primary/10 text-primary"
            >
              [{v}]
            </span>
          ))}

          {prompt.sharedDocs && prompt.sharedDocs.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold bg-success/10 text-success-800">
              <Link2 className="w-3 h-3" />
              {prompt.sharedDocs.length} doc{prompt.sharedDocs.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <button
          onClick={onTest}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all active:scale-95"
          aria-label="Testar prompt com IA"
          title="Testar prompt com IA"
        >
          <Play className="w-3.5 h-3.5 fill-primary" />
          <span>Testar</span>
        </button>

        <div className="flex items-center gap-1.5">
          <ActionMenu
            label={`Mais ações para ${prompt.title}`}
            items={[
              { label: 'Aprimorar com IA', icon: Wand2, onSelect: onEnhance },
              { label: 'Editar', icon: Pencil, onSelect: onEdit },
              { label: 'Duplicar', icon: CopyPlus, onSelect: onDuplicate },
              { label: 'Excluir', icon: Trash2, onSelect: onDelete, tone: 'danger' },
            ]}
            buttonClassName="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all focus-visible:outline-2 focus-visible:outline-primary"
          />

          <button
            onClick={onCopy}
            title={variables.length ? 'Preencher variáveis e copiar' : 'Copiar prompt'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isCopied ? 'bg-success text-white shadow-xs' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
