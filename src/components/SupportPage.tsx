import React from 'react';
import { ExternalLink, Headset } from 'lucide-react';
import { SUPPORT_FORM_URL } from './navItems';

export const SupportPage: React.FC = () => (
  <section
    aria-labelledby="support-heading"
    className="max-w-2xl mx-auto rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 sm:p-12 text-center"
  >
    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#1A73E8]/10">
      <Headset className="h-7 w-7 text-[#1A73E8]" />
    </div>

    <h1 id="support-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
      PRECISA DE AJUDA?
    </h1>
    <p className="mt-3 text-lg font-semibold text-[#1A73E8]">Fale com o time do Amplifica!</p>
    <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
      Estamos prontos para caminhar ao seu lado, oferecendo apoio, inspiração e as ferramentas que você precisa para
      brilhar na sua jornada. Não é apenas suporte — é parceria para transformar ideias em impacto real.
    </p>

    <a
      href={SUPPORT_FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1A73E8] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1765CC] transition-colors"
    >
      Suporte aqui
      <ExternalLink className="h-4 w-4" />
    </a>
  </section>
);
