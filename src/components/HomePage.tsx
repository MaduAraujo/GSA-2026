import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Award,
  FileText,
  Flag,
  Camera,
  BarChart3,
  GraduationCap,
  Trophy,
  Moon,
  Sun,
  Smartphone,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';
import { PwaGuideModal } from './PwaGuideModal';

interface HomePageProps {
  onLogin: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  deferredPrompt: any;
  onInstallPwa: () => void;
  isPwaModalOpen: boolean;
  onClosePwaModal: () => void;
}

const FEATURES = [
  {
    icon: Award,
    title: 'Certificados',
    description: 'Centralize e organize todos os seus certificados em um painel só.',
    accent: '#1A73E8',
  },
  {
    icon: FileText,
    title: 'Cofre de Prompts',
    description: 'Salve, categorize e reutilize os prompts que mais funcionam para o seu dia a dia.',
    accent: '#34A853',
  },
  {
    icon: GraduationCap,
    title: 'Sessões',
    description: 'Registre cada sessão de estudo: o dia, o desafio proposto, a ferramenta aprendida e a foto de comprovação.',
    accent: '#EA4335',
  },
  {
    icon: Flag,
    title: 'Desafios',
    description: 'Acompanhe metas e desafios da jornada como Embaixador(a), do início ao fim.',
    accent: '#FBBC04',
  },
  {
    icon: Camera,
    title: 'Galeria',
    description: 'Reúna fotos e registros dos eventos e atividades que você participou.',
    accent: '#1A73E8',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Visualize sua evolução com gráficos claros sobre certificados, posts e conquistas.',
    accent: '#34A853',
  },
];

const HIGHLIGHTS = [
  { icon: Smartphone, label: 'Instalável como app', accent: '#1A73E8' },
  { icon: ShieldCheck, label: 'Seus dados seguros', accent: '#34A853' },
  { icon: Zap, label: 'IA integrada', accent: '#FBBC04' },
];

const GoogleRingMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 192 192" className={className}>
    <path d="M 96,16 A 80,80 0 0,1 176,96" fill="none" stroke="#1A73E8" strokeWidth="14" strokeLinecap="round" />
    <path d="M 176,96 A 80,80 0 0,1 96,176" fill="none" stroke="#34A853" strokeWidth="14" strokeLinecap="round" />
    <path d="M 96,176 A 80,80 0 0,1 16,96" fill="none" stroke="#FBBC04" strokeWidth="14" strokeLinecap="round" />
    <path d="M 16,96 A 80,80 0 0,1 96,16" fill="none" stroke="#EA4335" strokeWidth="14" strokeLinecap="round" />
    <path d="M 96 56 L 140 78 L 96 100 L 52 78 Z" fill="#1A73E8" />
    <circle cx="96" cy="120" r="14" fill="#FBBC04" />
  </svg>
);

const AchievementStack: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const float = (offset: number, duration: number) =>
    reduceMotion
      ? {}
      : {
          animate: { y: [0, offset, 0] },
          transition: { duration, repeat: Infinity, ease: 'easeInOut' as const },
        };

  return (
    <div className="relative w-full max-w-sm mx-auto h-88 sm:h-88">
      <div className="absolute inset-0 rounded-full bg-blue-600/10 blur-3xl" />

      <motion.div
        className="absolute left-2 top-4 w-44 sm:w-48 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md p-3.5 -rotate-6"
        {...float(-8, 5)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-900 dark:text-gray-100 truncate">Data Analytics</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">40h certificadas</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute right-1 top-24 sm:top-28 w-40 sm:w-44 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md p-3.5 rotate-6"
        {...float(7, 6)}
      >
        <div className="flex items-center gap-0 sm:gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-600/10 text-green-600 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-2">Prompts</span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">12</span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">salvos</span>
        </div>
      </motion.div>

      <motion.div
        className="absolute left-1/2 -translate-x-1/2 bottom-2 w-64 sm:w-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-4 flex items-start gap-3 rotate-1"
        {...float(-6, 7)}
      >
        <div className="w-11 h-11 rounded-xl bg-yellow-500/15 text-yellow-600 flex items-center justify-center shrink-0">
          <Trophy className="w-5.5 h-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Badge desbloqueada!</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight mt-0.5">Voz da Comunidade</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" />
            3 posts publicados este mês
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({
  onLogin,
  isDarkMode,
  onToggleDarkMode,
  deferredPrompt,
  onInstallPwa,
  isPwaModalOpen,
  onClosePwaModal,
}) => {
  const reduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fadeUp = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: 'easeOut' as const },
        };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-sans overflow-x-hidden">
      <div className="h-1 w-full grid grid-cols-4">
        <div className="bg-blue-600" />
        <div className="bg-red-500" />
        <div className="bg-yellow-500" />
        <div className="bg-green-600" />
      </div>

      <header className="sticky top-0 z-30 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="sm:flex-1 flex items-center gap-2 min-w-0">
            <GoogleRingMark className="w-8 h-8 shrink-0" />
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base tracking-tight whitespace-nowrap truncate">
              Hub GSA 2026
            </span>
          </div>

          <nav className="hidden sm:flex flex-1 items-center justify-center gap-1">
            <a
              href="/sobre"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Sobre
            </a>
            <button
              type="button"
              onClick={onInstallPwa}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Instalar
            </button>
          </nav>

          <div className="flex items-center justify-end gap-1 sm:flex-1 sm:gap-3">
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label="Alternar tema"
              className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-all active:scale-95 whitespace-nowrap"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Abrir menu"
              aria-expanded={mobileMenuOpen}
              className="sm:hidden w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 dark:border-gray-800 px-4 py-3 space-y-1 bg-gray-50 dark:bg-gray-950">
            <a
              href="/sobre"
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Sobre
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onInstallPwa();
              }}
              className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Instalar
            </button>
          </div>
        )}
      </header>

      <main>
        <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="text-center lg:text-left">
              <motion.h1
                {...fadeUp(0)}
                className="text-4xl sm:text-5xl xl:text-6xl font-black text-gray-900 dark:text-gray-50 tracking-tight leading-[1.05]"
              >
                Toda a sua jornada de <span className="text-blue-600">Embaixador(a)</span>, organizada em um só lugar.
              </motion.h1>

              <motion.p
                {...fadeUp(0.16)}
                className="mt-5 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto lg:mx-0"
              >
                Simples, rápido e feito para acompanhar cada conquista da sua trajetória.
              </motion.p>
            </div>

            <motion.div
              {...(reduceMotion
                ? {}
                : {
                    initial: { opacity: 0, scale: 0.94 },
                    animate: { opacity: 1, scale: 1 },
                    transition: { duration: 0.6, delay: 0.2, ease: 'easeOut' as const },
                  })}
            >
              <AchievementStack />
            </motion.div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <hr className="border-t border-gray-200 dark:border-gray-800" />
        </div>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-16 sm:pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6" style={{ perspective: 900 }}>
            {HIGHLIGHTS.map(({ icon: Icon, label, accent }, i) => (
              <motion.div
                key={label}
                initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                whileHover={reduceMotion ? undefined : { rotateX: -8, rotateY: 8, y: -6, scale: 1.04 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
                style={{ transformStyle: 'preserve-3d' }}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-7 shadow-sm hover:shadow-xl transition-shadow cursor-default flex flex-col items-center text-center"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: `${accent}1A`,
                    color: accent,
                    boxShadow: `0 2px 0 0 ${accent}33 inset, 0 8px 16px -4px ${accent}55`,
                  }}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <p className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 leading-snug">
                  {label}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <hr className="border-t border-gray-200 dark:border-gray-800" />
        </div>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-20 sm:pb-28">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
              Tudo o que você precisa
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Seis módulos pensados para a rotina de um(a) Embaixador(a) Estudantil.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ perspective: 1000 }}>
            {FEATURES.map(({ icon: Icon, title, description, accent }, i) => (
              <motion.div
                key={title}
                initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                whileHover={reduceMotion ? undefined : { rotateX: -6, rotateY: 6, y: -6, scale: 1.02 }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08, ease: 'easeOut' }}
                style={{ transformStyle: 'preserve-3d' }}
                className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 overflow-hidden shadow-sm transition-shadow duration-200 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-xl text-center"
              >
                <span
                  className="absolute inset-x-0 top-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: accent }}
                />
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${accent}1A`,
                      color: accent,
                      boxShadow: `0 2px 0 0 ${accent}33 inset, 0 6px 12px -4px ${accent}55`,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </section>

      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
          <p className="text-center">© 2026 Embaixadores Estudantis do Google.<br className="sm:hidden" /> Todos os direitos reservados.</p>
        </div>
      </footer>

      <PwaGuideModal
        isOpen={isPwaModalOpen}
        onClose={onClosePwaModal}
        deferredPrompt={deferredPrompt}
        onInstall={onInstallPwa}
      />
    </div>
  );
};
