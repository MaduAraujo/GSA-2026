import { Check, Copy, Link2, Pencil, Play, Star, Trash2, Wand2 } from 'lucide-react';
import type { PromptItem } from '../../types';

const SECTION_STYLES: Record<string, string> = {
  Estudos: 'bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20',
  'Workshops & Eventos': 'bg-[#34A853]/10 text-[#2E7D32] border border-[#34A853]/20',
  'Criação de Conteúdo': 'bg-[#EA4335]/10 text-[#D93025] border border-[#EA4335]/20',
  'Carreira Tech': 'bg-[#FBBC04]/20 text-[#8F5200] border border-[#FBBC04]/30',
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
}: PromptCardProps) {
  return (
    <div
      id={`prompt-card-${prompt.id}`}
      className="bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#FBBC04]/60 transition-all p-6 flex flex-col justify-between space-y-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
              SECTION_STYLES[prompt.section] ?? 'bg-gray-100 text-gray-700'
            }`}
          >
            {prompt.section}
          </span>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-gray-400">Usado {prompt.usageCount || 0}x</span>
            <button
              onClick={onToggleFavorite}
              aria-label={prompt.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              aria-pressed={!!prompt.isFavorite}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#FBBC04] transition-colors"
            >
              <Star className={`w-4 h-4 ${prompt.isFavorite ? 'fill-[#FBBC04] text-[#FBBC04]' : ''}`} />
            </button>
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">{prompt.title}</h3>

        <div className="relative group bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-700 font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">
            {prompt.promptText}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {prompt.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600"
            >
              #{tag}
            </span>
          ))}

          {prompt.variables?.map((v) => (
            <span
              key={v}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#1A73E8]/10 text-[#1A73E8]"
            >
              [{v}]
            </span>
          ))}

          {prompt.sharedDocs && prompt.sharedDocs.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#34A853]/10 text-[#2E7D32]">
              <Link2 className="w-3 h-3" />
              {prompt.sharedDocs.length} doc{prompt.sharedDocs.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onTest}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A73E8]/10 hover:bg-[#1A73E8]/20 text-[#1A73E8] text-xs font-bold transition-all active:scale-95"
            aria-label="Testar prompt com Gemini"
            title="Testar prompt com Gemini"
          >
            <Play className="w-3.5 h-3.5 fill-[#1A73E8]" />
            <span>Testar</span>
          </button>

          <button
            onClick={onEnhance}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-semibold transition-all"
            aria-label="Aprimorar prompt com IA"
            title="Aprimorar prompt com IA"
          >
            <Wand2 className="w-3.5 h-3.5 text-[#FBBC04]" />
            <span className="hidden sm:inline">Aprimorar</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onEdit}
            className="p-2 rounded-xl text-gray-400 hover:text-[#1A73E8] hover:bg-[#1A73E8]/10"
            aria-label="Editar"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            onClick={onDelete}
            className="p-2 rounded-xl text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10"
            aria-label="Excluir"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onCopy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isCopied ? 'bg-[#34A853] text-white shadow-xs' : 'bg-gray-900 text-white hover:bg-gray-800'
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
