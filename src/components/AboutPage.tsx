import React from 'react';
import {
  Trophy,
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
} from 'lucide-react';

const HOW_IT_WORKS = [
  {
    icon: Globe2,
    title: 'Formato',
    text: 'Online.',
  },
  {
    icon: Calendar,
    title: 'Cronograma',
    text: 'Ocorre entre agosto e dezembro de 2026.',
  },
  {
    icon: MessagesSquare,
    title: 'Atividades',
    items: [
      'Troca diária de prompts',
      'Acesso a um portal exclusivo no Google Sites',
      'Masterclasses via Google Meet com especialistas e Googlers',
      'Apoio em estudos',
    ],
  },
  {
    icon: HeartHandshake,
    title: 'Caráter',
    text: 'É uma iniciativa voluntária que exige engajamento ativo na comunidade universitária.',
  },
];

const BENEFITS = [
  { icon: UserCheck, text: 'Mentoria e acompanhamento de especialistas certificados.' },
  { icon: Gift, text: 'Kit de boas-vindas exclusivo.' },
  { icon: BadgeCheck, text: 'Selos digitais oficiais para currículo e LinkedIn.' },
  { icon: Building2, text: 'Chance de participar de imersões presenciais nos escritórios do Google para os mais ativos.' },
  { icon: Users, text: 'Networking com estudantes de todo o país.' },
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

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="h-1 w-full grid grid-cols-4">
        <div className="bg-blue-600" />
        <div className="bg-red-500" />
        <div className="bg-yellow-500" />
        <div className="bg-green-600" />
      </div>

      <header className="sticky top-0 z-30 bg-gray-50/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <GoogleRingMark className="w-8 h-8 shrink-0" />
            <span className="font-bold text-gray-900 text-sm sm:text-base tracking-tight">Hub GSA 2026</span>
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
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 text-blue-600 border border-blue-600/20 text-xs font-bold uppercase tracking-wider mb-6">
            <Trophy className="w-3.5 h-3.5 text-[#FBBC04]" />
            Programa Oficial • Embaixadores Estudantis do Google 2026
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Sobre o Programa
          </h1>

          <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            O Programa de Embaixadores Estudantis do Google 2026 é uma iniciativa voltada para universitários com
            foco em inteligência artificial (IA) e no uso prático do Google Gemini para otimizar os estudos,
            desenvolver projetos e fortalecer o currículo. O programa busca formar referências locais de inovação
            e tecnologia dentro das universidades brasileiras.
          </p>
        </div>

        <div className="mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight text-center">
            Como Funciona o Programa
          </h2>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map(({ icon: Icon, title, ...rest }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">{title}</h3>
                {rest.items ? (
                  <ul className="text-xs sm:text-sm text-gray-600 leading-relaxed text-left space-y-1.5">
                    {rest.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{rest.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight text-center">
            Benefícios para os Selecionados
          </h2>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3.5"
              >
                <div className="w-8 h-8 rounded-lg bg-green-600/10 text-green-600 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm text-gray-800 leading-snug pt-1">{text}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center text-xs text-gray-600">
          <p>© 2026 Embaixadores Estudantis do Google. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
