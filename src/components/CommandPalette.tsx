import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  Award,
  Camera,
  CalendarClock,
  CornerDownLeft,
  FileText,
  Flag,
  GraduationCap,
  Link2,
  LogOut,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useCollectionData } from '../data/queries';
import { PAGE_PATHS, TAB_PATHS, type AppTab } from '../routes';
import { groupColor, NAV_ITEMS, PAGE_ITEMS } from './navItems';
import { Modal } from './ui/Modal';
import { normalizeSearch } from '../utils/search';

export interface CommandActions {
  onOpenProfile: () => void;
  onOpenAmbassadorArea: () => void;
  onOpenSettings: () => void;
  onToggleDarkMode: () => void;
  onSignOut: () => void;
}

interface CommandPaletteProps extends CommandActions {
  onClose: () => void;
}

interface Command {
  id: string;
  section: 'Ir para' | 'Ações' | 'Seus itens';
  label: string;
  hint?: string;
  icon: LucideIcon;
  iconClassName?: string;
  keywords?: string;
  run: () => void;
}

const MAX_ITEM_RESULTS = 8;

function useItemCommands(goToItem: (tab: AppTab, title: string, params?: Record<string, string>) => void): Command[] {
  const certificates = useCollectionData('certificates');
  const prompts = useCollectionData('prompts');
  const posts = useCollectionData('posts');
  const challenges = useCollectionData('challenges');
  const sessions = useCollectionData('sessions');
  const deadlines = useCollectionData('deadlines');
  const referenceLinks = useCollectionData('referenceLinks');
  const galleryPhotos = useCollectionData('galleryPhotos');

  return useMemo(() => {
    const item = (
      tab: AppTab,
      id: string,
      title: string,
      hint: string,
      icon: LucideIcon,
      params?: Record<string, string>,
    ): Command | null =>
      title.trim()
        ? {
            id: `${tab}:${id}`,
            section: 'Seus itens',
            label: title,
            hint,
            icon,
            iconClassName: groupColor(NAV_ITEMS.find((n) => n.id === tab)!.group),
            run: () => goToItem(tab, title, params),
          }
        : null;

    return [
      ...certificates.map((c) => item('certificates', c.id, c.title, 'Certificado', Award)),
      ...prompts.map((p) => item('prompts', p.id, p.title, 'Prompt', Sparkles)),
      ...posts.map((p) => item('posts', p.id, p.title, 'Post', FileText)),
      ...challenges.map((c) => item('challenges', c.id, c.title, c.type ?? 'Desafio', Flag, { tipo: c.type ?? '' })),
      ...sessions.map((s) =>
        item('sessions', s.id, s.title, s.type ?? 'Sessão', GraduationCap, { tipo: s.type ?? '' }),
      ),
      ...deadlines.map((d) => item('deadlines', d.id, d.title, 'Prazo', CalendarClock)),
      ...referenceLinks.map((r) => item('referenceLinks', r.id, r.title, 'Referência', Link2)),
      ...galleryPhotos.map((g) => item('gallery', g.id, g.caption, 'Galeria', Camera)),
    ].filter((c): c is Command => c !== null);
  }, [certificates, prompts, posts, challenges, sessions, deadlines, referenceLinks, galleryPhotos, goToItem]);
}

export function CommandPalette({
  onClose,
  onOpenProfile,
  onOpenAmbassadorArea,
  onOpenSettings,
  onToggleDarkMode,
  onSignOut,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  const goToItem = useMemo(
    () =>
      (tab: AppTab, title: string, params: Record<string, string> = {}) => {
        const search = new URLSearchParams({ q: title });
        for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
        navigate(`${TAB_PATHS[tab]}?${search.toString()}`);
      },
    [navigate],
  );
  const itemCommands = useItemCommands(goToItem);

  const staticCommands: Command[] = [
    ...NAV_ITEMS.map((item) => ({
      id: `tab:${item.id}`,
      section: 'Ir para' as const,
      label: item.label,
      icon: item.icon,
      iconClassName: groupColor(item.group),
      run: () => navigate(TAB_PATHS[item.id]),
    })),
    ...PAGE_ITEMS.map((item) => ({
      id: `page:${item.id}`,
      section: 'Ir para' as const,
      label: item.label,
      icon: item.icon,
      iconClassName: 'text-primary',
      run: () => navigate(PAGE_PATHS[item.id]),
    })),
    {
      id: 'page:levels',
      section: 'Ir para',
      label: 'Níveis',
      icon: Trophy,
      iconClassName: 'text-warning-600',
      run: () => navigate(PAGE_PATHS.levels),
    },
    { id: 'action:profile', section: 'Ações', label: 'Meu perfil', icon: User, run: onOpenProfile },
    {
      id: 'action:ambassador',
      section: 'Ações',
      label: 'Área do Embaixador(a)',
      icon: ShieldCheck,
      keywords: 'selo',
      run: onOpenAmbassadorArea,
    },
    { id: 'action:settings', section: 'Ações', label: 'Configurações', icon: Settings, run: onOpenSettings },
    {
      id: 'action:dark',
      section: 'Ações',
      label: 'Alternar modo escuro',
      icon: Moon,
      keywords: 'tema claro escuro dark',
      run: onToggleDarkMode,
    },
    {
      id: 'action:signout',
      section: 'Ações',
      label: 'Sair da conta',
      icon: LogOut,
      keywords: 'logout',
      run: onSignOut,
    },
  ];

  const q = normalizeSearch(query.trim());
  const matches = (c: Command) => normalizeSearch(`${c.label} ${c.hint ?? ''} ${c.keywords ?? ''}`).includes(q);
  const results = q
    ? [...staticCommands.filter(matches), ...itemCommands.filter(matches).slice(0, MAX_ITEM_RESULTS)]
    : staticCommands.filter((c) => c.section === 'Ir para');
  const safeIndex = Math.min(activeIndex, Math.max(results.length - 1, 0));
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const runCommand = (command: Command | undefined) => {
    if (!command) return;
    onClose();
    command.run();
  };

  const moveTo = (index: number) => {
    setActiveIndex(index);
    document.getElementById(optionId(index))?.scrollIntoView?.({ block: 'nearest' });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveTo((safeIndex + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveTo((safeIndex - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(results[safeIndex]);
    }
  };

  let lastSection: Command['section'] | null = null;

  return (
    <Modal onClose={onClose} label="Busca rápida" size="xl" className="sm:mt-[10vh] sm:self-start">
      <div className="flex items-center gap-3 px-4 border-b border-gray-100">
        <Search aria-hidden="true" className="w-5 h-5 text-gray-400 shrink-0" />
        <input
          type="text"
          role="combobox"
          aria-label="Buscar páginas, ações e seus itens"
          aria-expanded
          aria-controls={`${baseId}-list`}
          aria-activedescendant={results.length > 0 ? optionId(safeIndex) : undefined}
          aria-autocomplete="list"
          placeholder="Buscar páginas, ações e seus itens…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 py-4 text-base bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md border border-gray-200 text-2xs font-semibold text-gray-500">
          Esc
        </kbd>
      </div>

      <ul
        ref={listRef}
        id={`${baseId}-list`}
        role="listbox"
        aria-label="Resultados"
        className="overflow-y-auto overscroll-contain p-2 max-h-[60vh]"
      >
        {results.length === 0 && (
          <li role="presentation" className="px-3 py-10 text-center text-sm text-gray-500">
            Nada encontrado para “{query.trim()}”.
          </li>
        )}
        {results.map((command, index) => {
          const Icon = command.icon;
          const showSection = command.section !== lastSection;
          lastSection = command.section;
          const active = index === safeIndex;
          return [
            showSection && (
              <li
                key={`section-${command.section}`}
                role="presentation"
                className="px-3 pt-3 pb-1 text-2xs font-semibold text-gray-400"
              >
                {command.section}
              </li>
            ),
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={command.id}
              id={optionId(index)}
              role="option"
              aria-selected={active}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => runCommand(command)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm ${
                active ? 'bg-primary/10 text-gray-900' : 'text-gray-700'
              }`}
            >
              <Icon aria-hidden="true" className={`w-4.5 h-4.5 shrink-0 ${command.iconClassName ?? 'text-gray-500'}`} />
              <span className="flex-1 min-w-0 truncate font-medium">{command.label}</span>
              {command.hint && <span className="shrink-0 text-xs text-gray-400">{command.hint}</span>}
              {active && <CornerDownLeft aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-gray-400" />}
            </li>,
          ];
        })}
      </ul>

      <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 text-2xs text-gray-500">
        <span>
          <kbd className="font-semibold">↑↓</kbd> navegar
        </span>
        <span>
          <kbd className="font-semibold">Enter</kbd> abrir
        </span>
        <span>
          <kbd className="font-semibold">Ctrl K</kbd> abrir/fechar
        </span>
      </div>
    </Modal>
  );
}
