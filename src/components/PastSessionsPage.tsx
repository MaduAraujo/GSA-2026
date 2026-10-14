import React, { useRef, useState } from 'react';
import { CalendarDays, Eye, History, Loader2, Upload, UserRound, Users } from 'lucide-react';
import { useCollection, useCollectionMutation } from '../data/queries';
import { SupabaseStorageService as Storage } from '../services/supabaseStorage';
import type { SessionSummary } from '../types';
import { PAST_SESSIONS, type PastSession } from './pastSessions';

const MAX_SUMMARY_SIZE_BYTES = 50 * 1024 * 1024;
const SUMMARY_ACCEPT = '.pdf,.doc,.docx,.txt,.md,image/*';

interface SummaryActionProps {
  session: PastSession;
  summary?: SessionSummary;
  isLoading: boolean;
  onUpload: (sessionId: string, file: File) => Promise<void>;
}

const SummaryAction: React.FC<SummaryActionProps> = ({ session, summary, isLoading, onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return null;

  if (summary) {
    return summary.url ? (
      <a
        href={summary.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ver resumo"
        title="Ver resumo"
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#1A73E8] p-2.5 sm:px-4 sm:py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1765CC] transition-colors"
      >
        <Eye aria-hidden="true" className="h-4 w-4" />
        <span className="hidden sm:inline">Ver resumo</span>
      </a>
    ) : null;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    if (file.size > MAX_SUMMARY_SIZE_BYTES) {
      setError(`Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O limite é 50MB.`);
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(session.id, file);
    } catch {
      setError('Não foi possível enviar o resumo. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-end">
      <input
        ref={inputRef}
        type="file"
        accept={SUMMARY_ACCEPT}
        onChange={handleFileChange}
        className="hidden"
        aria-label={`Arquivo do resumo de ${session.title}`}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label={isUploading ? 'Enviando...' : 'Enviar resumo'}
        title="Enviar resumo"
        className="inline-flex items-center gap-2 rounded-full border border-[#1A73E8] p-2.5 sm:px-4 sm:py-2 text-sm font-semibold text-[#1A73E8] hover:bg-[#1A73E8]/5 disabled:opacity-60 disabled:cursor-wait transition-colors"
      >
        {isUploading ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Upload aria-hidden="true" className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">{isUploading ? 'Enviando...' : 'Enviar resumo'}</span>
      </button>
      {error && (
        <p role="alert" className="mt-2 max-w-48 text-right text-xs text-[#EA4335]">
          {error}
        </p>
      )}
    </div>
  );
};

interface PastSessionsListProps {
  summaries: SessionSummary[];
  isLoading: boolean;
  onUpload: (sessionId: string, file: File) => Promise<void>;
}

export const PastSessionsList: React.FC<PastSessionsListProps> = ({ summaries, isLoading, onUpload }) => {
  const summaryBySession = new Map(summaries.map((s) => [s.sessionId, s]));

  return (
    <section
      aria-labelledby="past-sessions-heading"
      className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 sm:p-12"
    >
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#1A73E8]/10">
          <History className="h-7 w-7 text-[#1A73E8]" />
        </div>

        <h1
          id="past-sessions-heading"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100"
        >
          REVISITE OS MOMENTOS DA JORNADA
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
          Aqui ficam reunidos os encontros que já aconteceram ao longo do programa. Consulte a data, conheça os
          facilitadores e guarde o seu resumo de cada encontro para retomar os principais aprendizados sempre que
          quiser.
        </p>
      </div>

      <ol className="mt-10 space-y-3">
        {PAST_SESSIONS.map((session) => (
          <li
            key={session.id}
            className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {session.series && (
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#1A73E8]">{session.series}</p>
                )}
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{session.title}</h2>
              </div>

              <SummaryAction
                session={session}
                summary={summaryBySession.get(session.id)}
                isLoading={isLoading}
                onUpload={onUpload}
              />
            </div>

            <dl className="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <dt>
                  <CalendarDays aria-hidden="true" className="h-4 w-4 text-gray-400" />
                  <span className="sr-only">Data</span>
                </dt>
                <dd>{session.date}</dd>
              </div>
              {session.people.map(({ role, names }) => {
                const Icon = role.startsWith('Team Leader') ? Users : UserRound;
                return (
                  <div key={role} className="flex flex-wrap items-start gap-x-2">
                    <dt className="flex shrink-0 items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                      <Icon aria-hidden="true" className="h-4 w-4 text-gray-400" />
                      {role}:
                    </dt>
                    <dd className="basis-full pl-6 sm:basis-auto sm:flex-1 sm:pl-0">{names}</dd>
                  </div>
                );
              })}
            </dl>
          </li>
        ))}
      </ol>
    </section>
  );
};

export const PastSessionsPage: React.FC = () => {
  const summaries = useCollection('sessionSummaries');
  const uploadSummary = useCollectionMutation(['sessionSummaries'], Storage.uploadSessionSummary);

  return <PastSessionsList summaries={summaries.data ?? []} isLoading={summaries.isPending} onUpload={uploadSummary} />;
};
