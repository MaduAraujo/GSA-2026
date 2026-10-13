import { BookOpen, CalendarPlus, CalendarRange, Compass } from 'lucide-react';
import { useState } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import type { HostedEvent } from '../../types';
import { todayISO } from '../../utils/date';
import { EventCard } from './EventCard';
import { EventFormModal } from './EventFormModal';
import { GuideView } from './GuideView';
import { QuickAccessBar } from './QuickAccessBar';

type View = 'guide' | 'events';

interface StudyGuideModuleProps {
  events: HostedEvent[];
  onSaveEvent: (event: HostedEvent) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export function StudyGuideModule({ events, onSaveEvent, onDeleteEvent }: StudyGuideModuleProps) {
  const [view, setView] = usePersistedState<View>('gsa_study_guide_view', 'guide');
  const [editing, setEditing] = useState<HostedEvent | 'new' | null>(null);
  const today = todayISO();

  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const handleDelete = async (event: HostedEvent) => {
    if (!confirm(`Deseja realmente excluir o evento "${event.title}"?`)) return;
    try {
      await onDeleteEvent(event.id);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir o evento. Tente novamente.');
    }
  };

  const tabClass = (active: boolean) =>
    `inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors ${
      active ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
    }`;

  const renderList = (title: string, list: HostedEvent[]) =>
    list.length > 0 && (
      <section aria-label={title} className="space-y-3">
        <h3 className="px-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
          {title} <span className="normal-case font-medium text-gray-400">({list.length})</span>
        </h3>
        {list.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            today={today}
            onSave={onSaveEvent}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        ))}
      </section>
    );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pt-15">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#34A853]" />
            <span>Grupo de Estudos</span>
          </h2>
        </div>
        {view === 'events' && (
          <button
            id="btn-new-event"
            onClick={() => setEditing('new')}
            aria-label="Novo evento"
            title="Novo evento"
            className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 shrink-0"
          >
            <CalendarPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo evento</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div role="tablist" aria-label="Seções do guia" className="flex gap-1 p-1 rounded-full bg-gray-100 shrink-0">
          <button
            type="button"
            role="tab"
            id="study-guide-tab-guide"
            aria-selected={view === 'guide'}
            aria-controls="study-guide-panel"
            onClick={() => setView('guide')}
            className={tabClass(view === 'guide')}
          >
            <Compass className="hidden sm:block w-4 h-4" />
            Guia
          </button>
          <button
            type="button"
            role="tab"
            id="study-guide-tab-events"
            aria-selected={view === 'events'}
            aria-controls="study-guide-panel"
            onClick={() => setView('events')}
            className={tabClass(view === 'events')}
          >
            <CalendarRange className="hidden sm:block w-4 h-4" />
            Meus eventos
            {events.length > 0 && (
              <span className="text-[11px] font-bold px-1.5 rounded-full bg-[#1A73E8]/10 text-[#1A73E8]">
                {events.length}
              </span>
            )}
          </button>
        </div>
        <div className="min-w-0">
          <QuickAccessBar />
        </div>
      </div>

      <div
        id="study-guide-panel"
        role="tabpanel"
        aria-labelledby={view === 'guide' ? 'study-guide-tab-guide' : 'study-guide-tab-events'}
        className="space-y-6"
      >
        {view === 'guide' ? (
          <GuideView />
        ) : events.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-10 text-center">
            <CalendarRange className="w-10 h-10 mx-auto text-gray-300" />
            <p className="mt-3 font-semibold text-gray-700">Nenhum evento planejado</p>
          </div>
        ) : (
          <>
            {renderList('Próximos', upcoming)}
            {renderList('Realizados', past)}
          </>
        )}
      </div>

      {editing && (
        <EventFormModal
          initial={editing === 'new' ? undefined : editing}
          onSave={onSaveEvent}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
