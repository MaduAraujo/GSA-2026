import { Check, Copy, ExternalLink, Hash, Link2, Palette } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { GEMINI_TEST_URL, MEDIA_KIT_URL, OFFICIAL_HASHTAG } from './guideContent';

type PillVariant = 'light' | 'glass';

const pillClass =
  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap active:scale-95';

const VARIANTS: Record<PillVariant, { idle: string; copied: string }> = {
  light: {
    idle: 'border bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
    copied: 'border bg-[#34A853]/10 border-[#34A853]/40 text-[#1E8E3E]',
  },
  glass: {
    idle: 'bg-white/40 dark:bg-white/5 text-gray-800 dark:text-gray-100 ring-1 ring-inset ring-gray-900/10 dark:ring-white/10 hover:bg-white/70 dark:hover:bg-white/10',
    copied: 'bg-[#34A853]/15 text-[#1E8E3E] dark:text-[#81C995] ring-1 ring-inset ring-[#34A853]/40',
  },
};

interface PillProps {
  label: string;
  icon?: ReactNode;
  variant?: PillVariant;
  compact?: boolean;
}

const labelText = (text: string, compact: boolean) =>
  compact ? <span className="hidden sm:inline">{text}</span> : text;

export function CopyButton({ value, label, icon, variant = 'light', compact = false }: PillProps & { value: string }) {
  const { copied, copy } = useCopyToClipboard();
  const isCopied = copied === value;
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      aria-label={isCopied ? `${label}: copiado` : label}
      title={label}
      className={`${pillClass} ${compact ? 'max-sm:px-2.5' : ''} ${isCopied ? VARIANTS[variant].copied : VARIANTS[variant].idle}`}
    >
      {isCopied ? <Check className="w-3.5 h-3.5" /> : (icon ?? <Copy className="w-3.5 h-3.5" />)}
      {labelText(isCopied ? 'Copiado!' : label, compact)}
    </button>
  );
}

export function LinkButton({ href, label, icon, variant = 'light', compact = false }: PillProps & { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={`${pillClass} ${compact ? 'max-sm:px-2.5' : ''} ${VARIANTS[variant].idle}`}
    >
      {icon ?? <ExternalLink className="w-3.5 h-3.5" />}
      {labelText(label, compact)}
    </a>
  );
}

export function QuickAccessBar() {
  return (
    <nav
      aria-label="Acesso rápido"
      className="rounded-full bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-inset ring-gray-900/5 dark:ring-white/10 p-1"
    >
      <div className="flex items-center gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CopyButton
          variant="glass"
          compact
          value={GEMINI_TEST_URL}
          label="Copiar link de teste"
          icon={<Link2 className="w-3.5 h-3.5" />}
        />
        <CopyButton
          variant="glass"
          compact
          value={OFFICIAL_HASHTAG}
          label="Copiar hashtag"
          icon={<Hash className="w-3.5 h-3.5" />}
        />
        <LinkButton
          variant="glass"
          compact
          href={MEDIA_KIT_URL}
          label="Media Kit"
          icon={<Palette className="w-3.5 h-3.5" />}
        />
      </div>
    </nav>
  );
}
