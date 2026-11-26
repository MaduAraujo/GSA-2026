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
  Sparkles,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';
import { PwaGuideModal } from './PwaGuideModal';
import { LegalFooterLinks } from './legal/LegalPage';
import { FeatureCarousel, FeatureCardContent, FEATURE_CARD_CLASS, type FeatureItem } from './home/FeatureCarousel';
import type { BeforeInstallPromptEvent } from '../hooks/usePwaInstall';
import { BRAND } from '../theme/colors';
import { BrandLogo } from './ui/BrandLogo';

interface HomePageProps {
  onLogin: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallPwa: () => void;
  isPwaModalOpen: boolean;
  onClosePwaModal: () => void;
}

const FEATURES: FeatureItem[] = [
  {
    icon: Award,
    title: 'Certificados',
    description: 'Centralize e organize todos os seus certificados em um painel só.',
    accent: BRAND.primary,
  },
  {
    icon: FileText,
    title: 'Cofre de Prompts',
    description: 'Salve, categorize e reutilize os prompts que mais funcionam para o seu dia a dia.',
    accent: BRAND.success,
  },
  {
    icon: GraduationCap,
    title: 'Sessões',
    description:
      'Registre cada sessão de estudo: o dia, o desafio proposto, a ferramenta aprendida e a foto de comprovação.',
    accent: BRAND.danger,
  },
  {
    icon: Flag,
    title: 'Desafios',
    description: 'Acompanhe metas e desafios da jornada como Embaixador(a), do início ao fim.',
    accent: BRAND.warning,
  },
  {
    icon: Camera,
    title: 'Galeria',
    description: 'Reúna fotos e registros dos eventos e atividades que você participou.',
    accent: BRAND.primary,
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Visualize sua evolução com gráficos claros sobre certificados, posts e conquistas.',
    accent: BRAND.success,
  },
  {
    icon: Sparkles,
    title: 'E muito mais',
    description: 'Badges, posts, grupo de estudos, portfólio público e IA para turbinar seus prompts.',
    accent: BRAND.danger,
  },
];

const HIGHLIGHTS: FeatureItem[] = [
  {
    icon: Smartphone,
    title: 'Instalável como app',
    description: 'Adicione à tela inicial do celular ou computador e acesse com um toque.',
    accent: BRAND.primary,
  },
  {
    icon: ShieldCheck,
    title: 'Seus dados seguros',
    description: 'Login protegido e arquivos privados: só você vê o que é seu.',
    accent: BRAND.success,
  },
  {
    icon: Zap,
    title: 'IA integrada',
    description: 'Melhore seus prompts e textos com sugestões geradas por IA.',
    accent: BRAND.warning,
  },
];

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
      <motion.div
        className="absolute left-2 top-4 w-44 sm:w-48 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md p-3.5 -rotate-6"
        {...float(-8, 5)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-2xs font-bold text-gray-900 dark:text-gray-100 truncate">Data Analytics</p>
            <p className="text-2xs text-gray-500 dark:text-gray-400">40h certificadas</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute right-1 top-24 sm:top-28 w-40 sm:w-44 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md p-3.5 rotate-6"
        {...float(7, 6)}
      >
        <div className="flex items-center gap-0 sm:gap-2">
          <div className="w-7 h-7 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-2xs font-semibold text-gray-500 dark:text-gray-400 ml-2">Prompts</span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">12</span>
          <span className="text-2xs text-gray-500 dark:text-gray-400 font-medium">salvos</span>
        </div>
      </motion.div>

      <motion.div
        className="absolute left-1/2 -translate-x-1/2 bottom-2 w-64 sm:w-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-4 flex items-start gap-3 rotate-1"
        {...float(-6, 7)}
      >
        <div className="w-11 h-11 rounded-xl bg-warning/15 text-warning-600 flex items-center justify-center shrink-0">
          <Trophy className="w-5.5 h-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xs font-semibold text-primary">Badge desbloqueada!</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight mt-0.5">Voz da Comunidade</p>
          <p className="text-2xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-success shrink-0" />3 posts publicados este mês
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
        <div className="bg-primary" />
        <div className="bg-danger" />
        <div className="bg-warning" />
        <div className="bg-success" />
      </div>

      <header className="sticky top-0 z-30 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="sm:flex-1 flex items-center gap-2 min-w-0">
            <BrandLogo className="w-10 h-10 shrink-0" />
            <span className="text-base font-bold text-gray-900 dark:text-gray-50 truncate">Hub GSA 2026</span>
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
              className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-700 text-white text-sm font-bold shadow-xs transition-all active:scale-95 whitespace-nowrap"
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
        <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="text-center lg:text-left">
              <motion.h1
                {...fadeUp(0)}
                className="text-4xl sm:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-gray-50 tracking-tight leading-[1.05]"
              >
                Toda a sua jornada de <span className="text-primary">Embaixador(a)</span>, organizada em um só lugar.
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {HIGHLIGHTS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
                className={`${FEATURE_CARD_CLASS} shadow-md`}
              >
                <FeatureCardContent {...item} />
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
              Módulos pensados para a rotina de um(a) Embaixador(a) Estudantil.
            </p>
          </div>

          <FeatureCarousel items={FEATURES} />
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <LegalFooterLinks />
          <p className="text-center">
            © 2026 Hub GSA 2026.
            <br className="sm:hidden" /> Todos os direitos reservados.
          </p>
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
