import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Sparkles,
  FileText,
  Flag,
  Camera,
  BarChart3,
  GraduationCap,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { AmbassadorProfile } from '../types';

export type AppTab = 'certificates' | 'prompts' | 'posts' | 'sessions' | 'challenges' | 'gallery' | 'analytics';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  profile: AmbassadorProfile;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  onOpenProfile,
  onOpenSettings,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  const navItems = [
    { id: 'certificates', label: 'Certificados', icon: Award, color: 'text-[#1A73E8]' },
    { id: 'prompts', label: 'Banco de Prompts', icon: Sparkles, color: 'text-[#F9AB00]' },
    { id: 'posts', label: 'Posts', icon: FileText, color: 'text-[#EA4335]' },
    { id: 'sessions', label: 'Sessões', icon: GraduationCap, color: 'text-[#34A853]' },
    { id: 'challenges', label: 'Desafios', icon: Flag, color: 'text-[#34A853]' },
    { id: 'gallery', label: 'Galeria', icon: Camera, color: 'text-[#EA4335]' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-[#1A73E8]' },
  ];

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
              <path d="M 96,16 A 80,80 0 0,1 176,96" fill="none" stroke="#1A73E8" strokeWidth="14" strokeLinecap="round" />
              <path d="M 176,96 A 80,80 0 0,1 96,176" fill="none" stroke="#34A853" strokeWidth="14" strokeLinecap="round" />
              <path d="M 96,176 A 80,80 0 0,1 16,96" fill="none" stroke="#FBBC04" strokeWidth="14" strokeLinecap="round" />
              <path d="M 16,96 A 80,80 0 0,1 96,16" fill="none" stroke="#EA4335" strokeWidth="14" strokeLinecap="round" />
              <path d="M 96 56 L 140 78 L 96 100 L 52 78 Z" fill="#1A73E8" />
              <circle cx="96" cy="120" r="14" fill="#FBBC04" />
            </svg>
          </div>

          <nav className="hidden md:flex flex-1 items-center justify-center">
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id as any)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? item.color : ''}`} />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center gap-0.5 ml-auto">
            <div className="relative" ref={accountMenuRef}>
              <button
                id="account-menu-btn"
                onClick={() => setAccountMenuOpen((v) => !v)}
                aria-label="Abrir menu da conta"
                aria-expanded={accountMenuOpen}
                className="flex items-center gap-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors p-0.5 pl-1"
              >
                <img
                  src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={profile.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
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
                    onClick={() => { setAccountMenuOpen(false); onOpenProfile(); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Meu Perfil</span>
                  </button>

                  <button
                    id="settings-btn"
                    onClick={() => { setAccountMenuOpen(false); onOpenSettings(); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span>Configurações</span>
                  </button>

                  <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

                  <button
                    id="sign-out-btn"
                    onClick={() => { setAccountMenuOpen(false); onSignOut(); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#C5221F] hover:bg-[#FCE8E6] dark:hover:bg-[#C5221F]/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
              className={`${iconBtnClass} md:hidden`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-[#1A73E8]/10 text-[#1A73E8] font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500'}`} />
                  <span>{item.id === 'prompts' ? 'Prompts' : item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};