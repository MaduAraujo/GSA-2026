import { GraduationCap, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { AmbassadorSession } from '../types';
import { SessionCard } from './sessions/SessionCard';
import { SessionDetailModal } from './sessions/SessionDetailModal';
import { SessionFormModal } from './sessions/SessionFormModal';
import { useSessionForm } from './sessions/useSessionForm';

interface SessionsModuleProps {
  sessions: AmbassadorSession[];
  onSaveSession: (session: AmbassadorSession, proofVideoFile?: File) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
}

export function SessionsModule({ sessions, onSaveSession, onDeleteSession }: SessionsModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingSession, setViewingSession] = useState<AmbassadorSession | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const form = useSessionForm();

  const query = searchQuery.toLowerCase();
  const sortedSessions = sessions
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
          onClick={form.openCreate}
          aria-label="Nova sessão"
          title="Nova sessão"
          className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova sessão</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Buscar sessões"
            placeholder="Buscar por sessão, desafio ou ferramenta..."
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
          <h3 className="text-lg font-bold text-gray-900">Nenhuma sessão encontrada</h3>
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
