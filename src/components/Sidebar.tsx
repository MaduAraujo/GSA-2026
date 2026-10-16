import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { PAGE_PATHS, TAB_PATHS, type AppPage, type AppTab } from '../routes';
import { NAV_ITEMS, PAGE_ITEMS } from './navItems';

const COLLAPSED_KEY = 'gsa_sidebar_collapsed';
const DESKTOP_QUERY = '(min-width: 768px)';

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia?.(DESKTOP_QUERY).matches ?? true);

  useEffect(() => {
    const mql = window.matchMedia?.(DESKTOP_QUERY);
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

interface SidebarProps {
  activeTab: AppTab | null;
  activePage?: AppPage | null;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  activePage = null,
  mobileOpen = false,
  onMobileClose = () => {},
}) => {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const isDesktop = useIsDesktop();
  const asideRef = useRef<HTMLElement>(null);
  const isDrawerOpen = !isDesktop && mobileOpen;
  const isCollapsed = isDesktop && collapsed;

  useFocusTrap(asideRef, onMobileClose, isDrawerOpen);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isDrawerOpen]);

  const itemClass = (isActive: boolean) =>
    `flex items-center gap-3 rounded-xl text-sm font-medium transition-colors ${
      isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
    } ${
      isActive
        ? 'bg-[#1A73E8]/10 text-[#1A73E8] font-semibold'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <>
      {isDrawerOpen && <div aria-hidden="true" onClick={onMobileClose} className="fixed inset-0 z-40 bg-black/40" />}

      <aside
        ref={asideRef}
        id="app-sidebar"
        aria-label="Navegação principal"
        inert={!isDesktop && !mobileOpen}
        className={`flex flex-col shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        } md:static md:inset-auto md:z-auto md:h-auto md:translate-x-0 md:shadow-none md:transition-[width] ${
          collapsed ? 'md:w-17' : 'md:w-60'
        }`}
      >
        {isDesktop ? (
          <div className={`flex p-2 ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
            <button
              onClick={() => setCollapsed((v) => !v)}
              aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
              aria-expanded={!isCollapsed}
              title={isCollapsed ? 'Expandir' : 'Recolher'}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Menu</span>
            <button
              onClick={onMobileClose}
              aria-label="Fechar menu"
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <nav className="sidebar-scroll min-h-0 md:flex-1 px-2 py-2 md:py-0 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                id={`nav-tab-${item.id}`}
                to={TAB_PATHS[item.id]}
                onClick={onMobileClose}
                aria-current={isActive ? 'page' : undefined}
                aria-label={isCollapsed ? item.label : undefined}
                title={isCollapsed ? item.label : undefined}
                className={itemClass(isActive)}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? item.color : 'text-gray-500'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 space-y-1 border-t border-gray-200 dark:border-gray-800">
          {PAGE_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <Link
                key={item.id}
                id={`${item.id}-link`}
                to={PAGE_PATHS[item.id]}
                onClick={onMobileClose}
                aria-current={isActive ? 'page' : undefined}
                aria-label={isCollapsed ? item.label : undefined}
                title={isCollapsed ? item.label : undefined}
                className={itemClass(isActive)}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#1A73E8]' : 'text-gray-500'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
};
