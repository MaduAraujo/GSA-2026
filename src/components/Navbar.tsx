import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { User, Settings, Menu, X, LogOut, ChevronDown, Globe, ShieldCheck, Trophy } from 'lucide-react';
import type { AmbassadorProfile } from '../types';
import { PAGE_PATHS, type AppTab } from '../routes';
import { OFFICIAL_SITE_URL } from './navItems';

export type { AppTab };

interface NavbarProps {
  isMobileNavOpen: boolean;
  onToggleMobileNav: () => void;
  profile: AmbassadorProfile;
  onOpenProfile: () => void;
  onOpenAmbassadorArea: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isMobileNavOpen,
  onToggleMobileNav,
  profile,
  onOpenProfile,
  onOpenAmbassadorArea,
  onOpenSettings,
  onSignOut,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      if (e.target === document) setIsScrolled(window.scrollY > 10);
      else if (e.target instanceof HTMLElement && e.target.id === 'app-scroll') setIsScrolled(e.target.scrollTop > 10);
    };
    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountMenuOpen]);

  const iconBtnClass =
    'p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors';

  return (
    <header
      className={`sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md transition-shadow ${
        isScrolled ? 'shadow-sm border-b border-transparent' : 'border-b border-gray-200 dark:border-gray-800'
      }`}
    >
      <div className="h-0.75 w-full grid grid-cols-4">
        <div className="bg-[#1A73E8]" />
        <div className="bg-[#EA4335]" />
        <div className="bg-[#FBBC04]" />
        <div className="bg-[#34A853]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          <div className="flex items-center shrink-0">
            <svg viewBox="0 0 192 192" className="w-8 h-8">
              <path
                d="M 96,16 A 80,80 0 0,1 176,96"
                fill="none"
                stroke="#1A73E8"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 176,96 A 80,80 0 0,1 96,176"
                fill="none"
                stroke="#34A853"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 96,176 A 80,80 0 0,1 16,96"
                fill="none"
                stroke="#FBBC04"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 16,96 A 80,80 0 0,1 96,16"
                fill="none"
                stroke="#EA4335"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path d="M 96 56 L 140 78 L 96 100 L 52 78 Z" fill="#1A73E8" />
              <circle cx="96" cy="120" r="14" fill="#FBBC04" />
            </svg>
          </div>

          <div className="flex items-center gap-0.5 ml-auto">
            <Link to={PAGE_PATHS.levels} aria-label="Níveis" title="Níveis" className={iconBtnClass}>
              <Trophy className="w-5 h-5 text-[#F9AB00]" />
            </Link>

            <div className="relative" ref={accountMenuRef}>
              <button
                id="account-menu-btn"
                onClick={() => setAccountMenuOpen((v) => !v)}
                aria-label="Abrir menu da conta"
                aria-expanded={accountMenuOpen}
                className="flex items-center gap-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors p-0.5 pl-1"
              >
                <img
                  src={
                    profile.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={profile.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg py-1.5 z-50"
                >
                  <div className="px-3.5 py-2 mb-1 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{profile.name}</p>
                    <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                  </div>

                  <button
                    id="profile-btn"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Meu Perfil</span>
                  </button>

                  <button
                    id="ambassador-area-btn"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onOpenAmbassadorArea();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <ShieldCheck className="w-4 h-4 text-gray-500" />
                    <span>Área do Embaixador(a)</span>
                  </button>

                  <button
                    id="settings-btn"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span>Configurações</span>
                  </button>

                  <a
                    id="official-site-link"
                    href={OFFICIAL_SITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setAccountMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span>Site Oficial</span>
                  </a>

                  <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

                  <button
                    id="sign-out-btn"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#C5221F] hover:bg-[#FCE8E6] dark:hover:bg-[#C5221F]/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onToggleMobileNav}
              aria-label={isMobileNavOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={isMobileNavOpen}
              aria-controls="app-sidebar"
              className={`${iconBtnClass} md:hidden`}
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
