import { useEffect } from 'react';
import { Link } from 'react-router';
import { Menu } from 'lucide-react';
import { TAB_PATHS, type AppTab } from '../routes';
import { BOTTOM_NAV_TABS, groupColor, NAV_ITEMS } from './navItems';

interface BottomNavProps {
  activeTab: AppTab | null;
  onOpenMore: () => void;
  isMoreOpen: boolean;
}

const BAR_HEIGHT = '4rem';

export function BottomNav({ activeTab, onOpenMore, isMoreOpen }: BottomNavProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bottom-nav-offset', `calc(${BAR_HEIGHT} + env(safe-area-inset-bottom, 0px))`);
    return () => {
      root.style.removeProperty('--bottom-nav-offset');
    };
  }, []);

  const items = BOTTOM_NAV_TABS.map((id) => NAV_ITEMS.find((item) => item.id === id)!);
  const isActiveInBar = BOTTOM_NAV_TABS.includes(activeTab as AppTab);
  const itemClass = (active: boolean) =>
    `flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-2xs font-semibold transition-colors ${
      active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'
    }`;

  return (
    <nav
      aria-label="Navegação rápida"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-16 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <Link
              key={item.id}
              to={TAB_PATHS[item.id]}
              aria-current={active ? 'page' : undefined}
              className={itemClass(active)}
            >
              <span
                className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors ${
                  active ? 'bg-primary/10' : ''
                }`}
              >
                <Icon aria-hidden="true" className={`w-5 h-5 ${active ? groupColor(item.group) : ''}`} />
              </span>
              <span className="truncate max-w-full px-1">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenMore}
          aria-expanded={isMoreOpen}
          aria-controls="app-sidebar"
          className={itemClass(isMoreOpen || (!!activeTab && !isActiveInBar))}
        >
          <span
            className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors ${
              !!activeTab && !isActiveInBar ? 'bg-primary/10' : ''
            }`}
          >
            <Menu aria-hidden="true" className="w-5 h-5" />
          </span>
          <span>Mais</span>
        </button>
      </div>
    </nav>
  );
}
