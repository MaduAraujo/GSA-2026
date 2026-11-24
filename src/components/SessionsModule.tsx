import { ArrowUpDown, GraduationCap, Plus, Wrench, X } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '../app/ToastProvider';
import { usePersistedState } from '../hooks/usePersistedState';
import { useUndoableDelete } from '../hooks/useUndoableDelete';
import { useUrlState } from '../hooks/useUrlState';
import type { AmbassadorSession, SessionType } from '../types';
import { normalizeSearch } from '../utils/search';
import { todayISO } from '../utils/date';
import { SelectDropdown } from './SelectDropdown';
import { SessionCard } from './sessions/SessionCard';
import { SessionDetailModal } from './sessions/SessionDetailModal';
import { SessionFormModal } from './sessions/SessionFormModal';
import { SESSION_TYPES, sessionTypeOf } from './sessions/sessionTypes';
import {
  collectTools,
  draftFromDuplicate,
  draftFromPastSession,
  findPastSession,
  groupSessionsByMonth,
  hasTool,
  isSessionSort,
  matchesSessionQuery,
  SESSION_FILTERS,
  SESSION_SORT_LABELS,
  SESSION_SORTERS,
  sessionFilterTest,
  type SessionSort,
} from './sessions/sessionView';
import { useSessionForm } from './sessions/useSessionForm';
import { Button } from './ui/Button';
import { EmptyState, NoResults } from './ui/EmptyState';
import { PageHeader } from './ui/PageHeader';
import { SearchField } from './ui/SearchField';

interface SessionsModuleProps {
  sessions: AmbassadorSession[];
  onSaveSession: (session: AmbassadorSession, proofVideoFile?: File) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
}

function FilterChip({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
        isActive
          ? 'bg-primary text-white shadow-xs'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
      }`}
    >
      {label}
      <span className={`tabular-nums text-2xs ${isActive ? 'opacity-80' : 'text-gray-400'}`}>{count}</span>
    </button>
  );
}

export function SessionsModule({ sessions: allSessions, onSaveSession, onDeleteSession }: SessionsModuleProps) {
  const toast = useToast();
  const pendingDelete = useUndoableDelete<AmbassadorSession>({
    commit: (x) => onDeleteSession(x.id),
    message: 'Registro excluído.',
    errorMessage: 'Não foi possível excluir o registro. Tente novamente.',
  });
  const sessions = allSessions.filter((x) => !pendingDelete.pendingIds.has(x.id));
  const [savedType, setSavedType] = usePersistedState<SessionType>('gsa_sessions_tab', 'Sessão');
  const [typeParam, setTypeParam] = useUrlState('tipo');
  const activeType = SESSION_TYPES.find((t) => t.type === typeParam)?.type ?? savedType;
  const selectTab = (type: SessionType) => {
    setSavedType(type);
    setTypeParam('');
  };
  const [searchQuery, setSearchQuery] = useUrlState('q');
  const [filter, setFilter] = useUrlState('filtro', 'todas');
  const [toolFilter, setToolFilter] = useUrlState('ferramenta');
  const [sortParam, setSortParam] = useUrlState('ordem', 'recentes');
  const sort: SessionSort = isSessionSort(sortParam) ? sortParam : 'recentes';
  const [viewingParam, setViewingParam] = useUrlState('abrir');
  const viewingId = viewingParam || null;
  const setViewingId = (id: string | null) => setViewingParam(id ?? '');
  const [registerParam, setRegisterParam] = useUrlState('registrar');
  const form = useSessionForm();

  const activeTab = SESSION_TYPES.find((t) => t.type === activeType) ?? SESSION_TYPES[2]!;
  const tabSessions = sessions.filter((s) => sessionTypeOf(s) === activeTab.type);
  const allTools = collectTools(sessions).map((t) => t.name);

  const searched = tabSessions.filter(
    (s) => matchesSessionQuery(s, searchQuery) && (!toolFilter || hasTool(s, toolFilter)),
  );
  const visibleSessions = searched.filter(sessionFilterTest(filter)).sort(SESSION_SORTERS[sort]);
  const groups =
    sort === 'pontuacao'
      ? [{ key: 'all', label: '', sessions: visibleSessions }]
      : groupSessionsByMonth(visibleSessions);
  const hasActiveFilters = !!searchQuery || filter !== 'todas' || !!toolFilter;

  const viewingIndex = viewingId ? visibleSessions.findIndex((s) => s.id === viewingId) : -1;
  const viewingSession =
    viewingIndex >= 0
      ? visibleSessions[viewingIndex]
      : viewingId
        ? sessions.find((s) => s.id === viewingId)
        : undefined;

  useEffect(() => {
    if (!registerParam) return;
    const past = findPastSession(registerParam);
    setRegisterParam('');
    if (!past) return;
    form.openPrefilled(draftFromPastSession(past));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per incoming link
  }, [registerParam]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilter('todas');
    setToolFilter('');
  };

  const openCreate = () => {
    const restored = form.openCreate(activeTab.type);
    if (restored) {
      toast.show({
        message: 'Rascunho restaurado.',
        action: {
          label: 'Começar do zero',
          onClick: () => form.openPrefilled({ type: activeTab.type }),
        },
      });
    }
  };

  const closeForm = () => {
    const { isDirty, isEditing } = form;
    form.close();
    if (!isDirty) return;
    if (isEditing) {
      toast.show({ message: 'Alterações descartadas.', action: { label: 'Desfazer', onClick: form.reopen } });
    } else {
      toast.show({
        message: `Rascunho guardado. Ele volta em “${activeTab.newLabel}”.`,
        action: { label: 'Descartar', onClick: form.reset },
      });
    }
  };

  const handleDelete = (session: AmbassadorSession) => {
    setViewingId(null);
    pendingDelete.remove(session);
  };

  const handleEdit = (session: AmbassadorSession) => {
    setViewingId(null);
    form.openEdit(session);
  };

  const handleAddProof = (session: AmbassadorSession) => {
    handleEdit(session);
    requestAnimationFrame(() =>
      document.getElementById('session-form-proof')?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
    );
  };

  const handleDuplicate = (session: AmbassadorSession) => {
    setViewingId(null);
    form.openPrefilled(draftFromDuplicate(session, todayISO()));
  };

  const toggleTool = (tool: string) => setToolFilter(normalizeSearch(toolFilter) === normalizeSearch(tool) ? '' : tool);

  return (
    <div className="space-y-6">
      <PageHeader icon={GraduationCap} iconClassName="text-primary" title="Sessões">
        <Button
          id="btn-new-session"
          onClick={openCreate}
          aria-label={activeTab.newLabel}
          title={activeTab.newLabel}
          variant="primary"
          collapseLabel
          icon={<Plus className="w-4 h-4" />}
        >
          {activeTab.newLabel}
        </Button>
      </PageHeader>

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
              onClick={() => selectTab(type)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selected ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`min-w-5 px-1.5 rounded-full text-2xs font-bold ${
                  selected ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tabSessions.length > 0 && (
        <div className="space-y-3">
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            label={`Buscar ${activeTab.plural}`}
            placeholder="Buscar por título, desafio, ferramenta ou anotação..."
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div
              role="group"
              aria-label="Filtrar registros"
              className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
            >
              {SESSION_FILTERS.map((f) => (
                <FilterChip
                  key={f.value}
                  label={f.label}
                  count={searched.filter(f.test).length}
                  isActive={filter === f.value}
                  onClick={() => setFilter(f.value)}
                />
              ))}
              {toolFilter && (
                <button
                  type="button"
                  onClick={() => setToolFilter('')}
                  aria-label={`Remover filtro de ferramenta ${toolFilter}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap bg-primary text-white shadow-xs"
                >
                  <Wrench aria-hidden="true" className="w-3.5 h-3.5" />
                  {toolFilter}
                  <X aria-hidden="true" className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative w-44 shrink-0">
              <SelectDropdown
                value={sort}
                onChange={(v) => setSortParam(v)}
                options={(Object.keys(SESSION_SORT_LABELS) as SessionSort[]).map((opt) => ({
                  value: opt,
                  label: <span className="whitespace-nowrap">{SESSION_SORT_LABELS[opt]}</span>,
                }))}
                ariaLabel="Ordenar registros"
                buttonClassName="w-full h-8.5 pl-7 pr-7 rounded-xl text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <ArrowUpDown
                aria-hidden="true"
                className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
        </div>
      )}

      {tabSessions.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          iconClassName="bg-primary/10 text-primary"
          title={`Nenhum item em ${activeTab.tab}`}
          description="Registre o que você assistiu e aprendeu para acompanhar suas horas, pontos e ferramentas."
          action={{
            label: activeTab.newLabel,
            onClick: openCreate,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : visibleSessions.length === 0 ? (
        <NoResults
          title="Nenhum registro encontrado"
          description="Nenhum registro corresponde à busca e aos filtros atuais."
          onClear={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.label || activeTab.tab} className="space-y-3">
              {group.label && (
                <h3 className="sticky top-16.75 md:top-0 z-20 -mx-1 px-1 py-2 flex items-center gap-2 text-sm font-bold text-gray-700 bg-surface-muted/95 backdrop-blur-sm">
                  {group.label}
                  <span className="text-xs font-medium text-gray-400">
                    {group.sessions.length} {group.sessions.length === 1 ? activeTab.noun : activeTab.plural}
                  </span>
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    activeTool={toolFilter}
                    onOpen={() => setViewingId(session.id)}
                    onEdit={() => handleEdit(session)}
                    onDuplicate={() => handleDuplicate(session)}
                    onDelete={() => handleDelete(session)}
                    onAddProof={() => handleAddProof(session)}
                    onToolClick={toggleTool}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {form.isOpen && (
        <SessionFormModal form={form} onSaveSession={onSaveSession} onClose={closeForm} toolSuggestions={allTools} />
      )}

      {viewingSession && !form.isOpen && (
        <SessionDetailModal
          session={viewingSession}
          position={viewingIndex >= 0 ? { index: viewingIndex, total: visibleSessions.length } : { index: 0, total: 1 }}
          onNavigate={(offset) => {
            const next = visibleSessions[viewingIndex + offset];
            if (next) setViewingId(next.id);
          }}
          onClose={() => setViewingId(null)}
          onEdit={() => handleEdit(viewingSession)}
          onDuplicate={() => handleDuplicate(viewingSession)}
          onDelete={() => handleDelete(viewingSession)}
          onAddProof={() => handleAddProof(viewingSession)}
        />
      )}
    </div>
  );
}
