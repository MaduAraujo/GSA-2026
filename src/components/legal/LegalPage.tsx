import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';

export interface LegalSection {
  title: string;
  body: React.ReactNode;
}

interface LegalPageProps {
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
}

export const LegalFooterLinks: React.FC<{ className?: string }> = ({ className }) => (
  <nav aria-label="Documentos legais" className={`flex items-center justify-center gap-4 ${className ?? ''}`}>
    <a href="/privacidade" className="hover:text-gray-900 dark:hover:text-gray-200 hover:underline">
      Privacidade
    </a>
    <a href="/termos" className="hover:text-gray-900 dark:hover:text-gray-200 hover:underline">
      Termos de uso
    </a>
  </nav>
);

export const LegalPage: React.FC<LegalPageProps> = ({ title, intro, updatedAt, sections }) => (
  <div className="min-h-screen bg-gray-50 font-sans">
    <header className="sticky top-0 z-30 bg-gray-50/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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

    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">Última atualização: {updatedAt}</p>
      <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed">{intro}</p>

      <div className="mt-10 space-y-5">
        {sections.map((section, i) => (
          <section
            key={section.title}
            className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-md overflow-hidden"
          >
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 top-0 h-1 ${['bg-primary', 'bg-danger', 'bg-warning', 'bg-success'][i % 4]}`}
            />
            <h2 className="text-lg font-bold text-gray-900">
              {i + 1}. {section.title}
            </h2>
            <div className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-gray-800 dark:[&_strong]:text-gray-100">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </main>

    <footer className="border-t border-gray-200 bg-white py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-gray-600 space-y-2 text-center">
        <LegalFooterLinks />
        <p>© 2026 Embaixadores Estudantis do Google. Todos os direitos reservados.</p>
      </div>
    </footer>
  </div>
);
