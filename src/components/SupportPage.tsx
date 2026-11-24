import React from 'react';
import { ExternalLink, Headset } from 'lucide-react';
import { SUPPORT_FORM_URL } from './navItems';
import { PageIntro } from './ui/PageIntro';

export const SupportPage: React.FC = () => (
  <section
    aria-labelledby="support-heading"
    className="max-w-2xl mx-auto rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 sm:p-12 text-center"
  >
    <PageIntro
      icon={Headset}
      headingId="support-heading"
      title="Precisa de ajuda?"
      tagline="Fale com o time do Amplifica!"
      description="Estamos prontos para caminhar ao seu lado, oferecendo apoio, inspiração e as ferramentas que você precisa para brilhar na sua jornada. Não é apenas suporte — é parceria para transformar ideias em impacto real."
    />

    <a
      href={SUPPORT_FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
    >
      Suporte aqui
      <ExternalLink className="h-4 w-4" />
    </a>
  </section>
);
