import React from 'react';
import {
  ArrowLeft,
  Globe2,
  MessagesSquare,
  HeartHandshake,
  UserCheck,
  Gift,
  BadgeCheck,
  Building2,
  Users,
  Calendar,
  Puzzle,
  Sparkles,
  Briefcase,
  Megaphone,
} from 'lucide-react';
import { BRAND } from '../theme/colors';
import { BrandLogo } from './ui/BrandLogo';
import { LegalFooterLinks } from './legal/LegalPage';
import { FeatureCardContent, FEATURE_CARD_CLASS, type FeatureItem } from './home/FeatureCarousel';

const ACTIVITIES = [
  'Troca diária de prompts',
  'Portal exclusivo no Google Sites',
  'Masterclasses no Google Meet com especialistas e Googlers',
  'Apoio nos estudos',
];

const HOW_IT_WORKS: FeatureItem[] = [
  {
    icon: Globe2,
    title: 'Formato',
    description: '100% online, para participar de qualquer lugar do Brasil.',
    accent: BRAND.primary,
  },
  {
    icon: Calendar,
    title: 'Cronograma',
    description: 'De agosto a dezembro de 2026.',
    accent: BRAND.danger,
  },
  {
    icon: MessagesSquare,
    title: 'Atividades',
    description: (
      <ul className="space-y-1.5">
        {ACTIVITIES.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0 mt-2" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ),
    accent: BRAND.warning,
  },
  {
    icon: HeartHandshake,
    title: 'Caráter',
    description: 'Iniciativa voluntária que pede engajamento ativo na comunidade universitária.',
    accent: BRAND.success,
  },
];

const COMPETENCIES: FeatureItem[] = [
  {
    icon: Puzzle,
    title: 'Resolução de problemas',
    description: 'Analise informações, organize ideias e encontre soluções com mais autonomia.',
    accent: BRAND.primary,
  },
  {
    icon: Sparkles,
    title: 'Comunicação e criatividade',
    description: 'Comunique com clareza e transforme ideias em conteúdo de qualidade.',
    accent: BRAND.danger,
  },
  {
    icon: Briefcase,
    title: 'Desenvolvimento de carreira',
    description: 'Amplie seu repertório e fortaleça sua presença profissional.',
    accent: BRAND.warning,
  },
  {
    icon: Megaphone,
    title: 'Liderança e impacto',
    description: 'Compartilhe conhecimento, conecte pessoas e promova o uso crítico e responsável da IA.',
    accent: BRAND.success,
  },
];

const BENEFITS: FeatureItem[] = [
  {
    icon: UserCheck,
    title: 'Mentoria',
    description: 'Acompanhamento de especialistas certificados ao longo do programa.',
    accent: BRAND.primary,
  },
  {
    icon: Gift,
    title: 'Kit de boas-vindas',
    description: 'Um kit exclusivo para começar a jornada.',
    accent: BRAND.danger,
  },
  {
    icon: BadgeCheck,
    title: 'Selos digitais',
    description: 'Selos oficiais para destacar no currículo e no LinkedIn.',
    accent: BRAND.warning,
  },
  {
    icon: Building2,
    title: 'Imersões presenciais',
    description: 'Os mais ativos podem participar de imersões nos escritórios do Google.',
    accent: BRAND.success,
  },
  {
    icon: Users,
    title: 'Networking',
    description: 'Conexão com estudantes de todo o país.',
    accent: BRAND.primary,
  },
];

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="h-1 w-full grid grid-cols-4">
        <div className="bg-primary" />
        <div className="bg-danger" />
        <div className="bg-warning" />
        <div className="bg-success" />
      </div>

      <header className="sticky top-0 z-30 bg-gray-50/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" aria-label="Hub GSA 2026 — página inicial" className="flex items-center">
            <BrandLogo className="w-10 h-10 shrink-0" />
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Sobre o Programa
          </h1>

          <p className="mt-5 text-base sm:text-lg text-gray-600">
            O Programa de Embaixadores Estudantis do Google 2026 é uma iniciativa voltada para universitários com foco
            em inteligência artificial (IA) e no uso prático do Google Gemini para otimizar os estudos, desenvolver
            projetos e fortalecer o currículo. O programa busca formar referências locais de inovação e tecnologia
            dentro das universidades brasileiras.
          </p>

          <p className="mt-4 text-base sm:text-lg text-gray-600">
            Para apoiar essa evolução, a trilha é rica e multidisciplinar, desenvolvendo 4 competências essenciais:
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {COMPETENCIES.map((item) => (
            <div key={item.title} className={`${FEATURE_CARD_CLASS} shadow-md`}>
              <FeatureCardContent {...item} />
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight text-center">
            Como Funciona o Programa?
          </h2>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.title} className={`${FEATURE_CARD_CLASS} shadow-md`}>
                <FeatureCardContent {...item} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight text-center">
            Benefícios para os Selecionados
          </h2>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {BENEFITS.map((item, i) => (
              <div
                key={item.title}
                className={`${FEATURE_CARD_CLASS} shadow-md ${
                  i === BENEFITS.length - 1 && BENEFITS.length % 2 === 1 ? 'sm:col-span-2' : ''
                }`}
              >
                <FeatureCardContent {...item} />
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-2 text-xs text-gray-600">
          <LegalFooterLinks />
          <p className="text-center">
            © 2026 Embaixadores Estudantis do Google.
            <br className="sm:hidden" /> Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};
