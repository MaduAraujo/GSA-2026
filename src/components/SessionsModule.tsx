import { GraduationCap, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';
import type { AmbassadorSession, SessionType } from '../types';
import { SessionCard } from './sessions/SessionCard';
import { SessionDetailModal } from './sessions/SessionDetailModal';
import { SessionFormModal } from './sessions/SessionFormModal';
import { SESSION_TYPES, sessionTypeOf } from './sessions/sessionTypes';
import { useSessionForm } from './sessions/useSessionForm';

interface SessionsModuleProps {
  sessions: AmbassadorSession[];
  onSaveSession: (session: AmbassadorSession, proofVideoFile?: File) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
}

export function SessionsModule({ sessions, onSaveSession, onDeleteSession }: SessionsModuleProps) {
  const [activeType, setActiveType] = usePersistedState<SessionType>('gsa_sessions_tab', 'Sessão');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingSession, setViewingSession] = useState<AmbassadorSession | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const form = useSessionForm();

  const activeTab = SESSION_TYPES.find((t) => t.type === activeType) ?? SESSION_TYPES[2]!;
  const tabSessions = sessions.filter((s) => sessionTypeOf(s) === activeTab.type);
  const query = searchQuery.toLowerCase();
  const sortedSessions = tabSessions
    .filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        (s.challenge || '').toLowerCase().includes(query) ||
        s.toolLearned.toLowerCase().includes(query),
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const handleDelete = async (session: AmbassadorSession) => {
    if (!confirm('Deseja realmente remover esta sessão?')) return;
    setDeletingId(session.id);
    try {
      await onDeleteSession(session.id);
      setViewingSession(null);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir a sessão. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pt-15">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-[#34A853]" />
            <span>Sessões</span>
          </h2>
        </div>

        <button
          id="btn-new-session"
          onClick={() => form.openCreate(activeTab.type)}
          aria-label={activeTab.newLabel}
          title={activeTab.newLabel}
          className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{activeTab.newLabel}</span>
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Tipos de sessão"
        className="flex gap-1 p-1 rounded-2xl bg-gray-100 overflow-x-auto scrollbar-none"
      >
        {SESSION_TYPES.map(({ type, tab }) => {
          const selected = type === activeTab.type;
          const count = sessions.filter((s) => sessionTypeOf(s) === type).length;
          return (
            <button
              key={type}
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveType(type)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selected ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`min-w-5 px-1.5 rounded-full text-[11px] font-bold ${
                  selected ? 'bg-[#34A853]/10 text-[#1E8E3E]' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Buscar sessões"
            placeholder="Buscar por título, desafio ou ferramenta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#34A853]/30 focus:border-[#34A853] bg-gray-50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {sortedSessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#34A853]/10 text-[#34A853] flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {tabSessions.length === 0 ? `Nenhum item em ${activeTab.tab}` : 'Nada encontrado'}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedSessions.map((session) => (
            <SessionCard key={session.id} session={session} onOpen={() => setViewingSession(session)} />
          ))}
        </div>
      )}

      {form.isOpen && <SessionFormModal form={form} onSaveSession={onSaveSession} />}

      {viewingSession && !form.isOpen && (
        <SessionDetailModal
          session={viewingSession}
          isDeleting={deletingId === viewingSession.id}
          onClose={() => setViewingSession(null)}
          onEdit={() => {
            setViewingSession(null);
            form.openEdit(viewingSession);
          }}
          onDelete={() => handleDelete(viewingSession)}
        />
      )}
    </div>
  );
}
