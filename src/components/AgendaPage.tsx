import React from 'react';
import { CalendarDays, ExternalLink, Rocket } from 'lucide-react';
import { AGENDA_ONBOARDING_URL, AGENDA_WEEKS, currentAgendaWeek } from './agendaWeeks';

export const AgendaPage: React.FC = () => {
  const current = currentAgendaWeek();

  return (
    <section
      aria-labelledby="agenda-heading"
      className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 sm:p-12"
    >
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#1A73E8]/10">
          <CalendarDays className="h-7 w-7 text-[#1A73E8]" />
        </div>

        <h1
          id="agenda-heading"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100"
        >
          O QUE VEM POR AÍ
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
          Toda semana temos novos encontros, novos conteúdos e novos momentos para movimentar a jornada do Programa.
        </p>
      </div>

      <a
        href={AGENDA_ONBOARDING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 flex items-center gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-4 transition-colors hover:border-[#1A73E8] hover:bg-[#1A73E8]/5 focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A73E8]/10">
          <Rocket aria-hidden="true" className="h-5 w-5 text-[#1A73E8]" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">Onboarding</span>
          <span className="block text-sm text-gray-600 dark:text-gray-400">Comece por aqui</span>
        </span>
        <ExternalLink aria-hidden="true" className="h-4 w-4 text-gray-400" />
      </a>

      <ol className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {AGENDA_WEEKS.map(({ week, start, end, url }) => {
          const isCurrent = week === current;
          const cardClass = `block h-full rounded-2xl border px-5 py-4 transition-colors ${
            isCurrent
              ? 'border-[#1A73E8] bg-[#1A73E8]/10'
              : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'
          } ${url ? 'hover:border-[#1A73E8] hover:bg-[#1A73E8]/5 focus-visible:outline-2 focus-visible:outline-[#1A73E8]' : ''}`;
          const content = (
            <>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-sm font-semibold ${isCurrent ? 'text-[#1A73E8]' : 'text-gray-900 dark:text-gray-100'}`}
                >
                  Semana {week}
                </span>
                {isCurrent ? (
                  <span className="rounded-full bg-[#1A73E8] px-2.5 py-0.5 text-xs font-semibold text-white">
                    Esta semana
                  </span>
                ) : (
                  url && <ExternalLink aria-hidden="true" className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {start} a {end}
              </p>
            </>
          );
          return (
            <li key={week} aria-current={isCurrent ? 'date' : undefined}>
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className={cardClass}>
                  {content}
                </a>
              ) : (
                <div className={cardClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};
