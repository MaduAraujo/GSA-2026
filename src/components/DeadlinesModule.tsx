import React, { useState } from 'react';
import { useUndoableDelete } from '../hooks/useUndoableDelete';
import { useToast } from '../app/ToastProvider';
import { ActionMenu } from './ActionMenu';
import { EmptyState, NoResults } from './ui/EmptyState';
import { SearchField } from './ui/SearchField';
import { useUrlState } from '../hooks/useUrlState';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { CalendarClock, Plus, Trash2, Pencil, Loader2, CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import { type DeadlineCategory, type ProgramDeadline } from '../types';
import { usePersistedState } from '../hooks/usePersistedState';
import { DeadlineFormModal } from './deadlines/DeadlineFormModal';
import { formatDateBR, formatMonthYearBR, todayISO } from '../utils/date';

interface DeadlinesModuleProps {
  deadlines: ProgramDeadline[];
  onSaveDeadline: (deadline: ProgramDeadline) => Promise<void>;
  onDeleteDeadline: (id: string) => Promise<void>;
}

const CATEGORY_DOT: Record<DeadlineCategory, string> = {
  Desafio: 'bg-success',
  Sessão: 'bg-primary',
  Post: 'bg-danger',
  Outro: 'bg-gray-400',
};

const DEFAULT_FORM: Partial<ProgramDeadline> = {
  title: '',
  date: '',
  category: undefined,
  notes: '',
  points: undefined,
  week: undefined,
  isCompleted: false,
};

function getMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function formatMonthLabel(monthKey: string): string {
  return formatMonthYearBR(`${monthKey}-01`);
}

interface MonthGroupProps {
  monthKey: string;
  deadlines: ProgramDeadline[];
  today: string;
  togglingId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleComplete: (deadline: ProgramDeadline) => void;
  onEdit: (deadline: ProgramDeadline) => void;
  onDelete: (deadline: ProgramDeadline) => void;
}

const MonthGroup: React.FC<MonthGroupProps> = ({
  monthKey,
  deadlines,
  today,
  togglingId,
  isCollapsed,
  onToggleCollapse,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const monthLabel = formatMonthLabel(monthKey);
  const monthPoints = deadlines.reduce((sum, d) => sum + (d.points || 0), 0);
  const monthCompletedCount = deadlines.filter((d) => d.isCompleted).length;
  const monthProgressPercent = deadlines.length > 0 ? Math.round((monthCompletedCount / deadlines.length) * 100) : 0;
  const plural = deadlines.length === 1 ? '' : 's';

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? `Expandir ${monthLabel}` : `Recolher ${monthLabel}`}
          className="flex items-center gap-1.5 min-w-0 text-sm font-semibold text-gray-700 hover:text-gray-900"
        >
          <ChevronDown
            aria-hidden="true"
            className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
          />
          <span className="truncate first-letter:uppercase">{monthLabel}</span>
        </button>

        <div className="flex items-center gap-2.5 shrink-0 text-xs text-gray-500">
          {monthPoints > 0 && <span className="hidden sm:inline tabular-nums">{monthPoints} pts ·</span>}
          <span className="tabular-nums">
            {monthCompletedCount} de {deadlines.length} prazo{plural} cumprido{plural}
          </span>
          <div
            role="progressbar"
            aria-valuenow={monthProgressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso de prazos cumpridos em ${monthLabel}`}
            className="w-12 sm:w-20 h-1.5 rounded-full bg-gray-200 overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-success transition-all duration-300"
              style={{ width: `${monthProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <ul className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {deadlines.map((deadline) => {
            const isOverdue = !deadline.isCompleted && deadline.date < today;
            const dotClass = CATEGORY_DOT[deadline.category] || CATEGORY_DOT.Outro;
            return (
              <li key={deadline.id} id={`deadline-row-${deadline.id}`} className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => onToggleComplete(deadline)}
                  disabled={togglingId === deadline.id}
                  aria-label={deadline.isCompleted ? 'Marcar como pendente' : 'Marcar como concluído'}
                  title={deadline.isCompleted ? 'Marcar como pendente' : 'Marcar como concluído'}
                  className="shrink-0 p-1 -m-1 rounded-full text-gray-300 hover:text-success disabled:opacity-50"
                >
                  {togglingId === deadline.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  ) : deadline.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    title={deadline.title}
                    className={`truncate text-sm font-medium ${deadline.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                  >
                    {deadline.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500">
                    {isOverdue && (
                      <>
                        <span className="font-medium text-danger-600">Atrasado</span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span className={isOverdue ? 'text-danger-600' : ''}>{formatDateBR(deadline.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                      {deadline.category}
                    </span>
                    {typeof deadline.week === 'number' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Semana {deadline.week}</span>
                      </>
                    )}
                    {typeof deadline.points === 'number' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{deadline.points} pts</span>
                      </>
                    )}
                  </p>
                  {deadline.notes && (
                    <p className="mt-0.5 text-xs text-gray-400 line-clamp-1" title={deadline.notes}>
                      {deadline.notes}
                    </p>
                  )}
                </div>

                <ActionMenu
                  label={`Mais ações para ${deadline.title}`}
                  items={[
                    { label: 'Editar', icon: Pencil, onSelect: () => onEdit(deadline) },
                    { label: 'Excluir', icon: Trash2, tone: 'danger', onSelect: () => onDelete(deadline) },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export const DeadlinesModule: React.FC<DeadlinesModuleProps> = ({
  deadlines: allDeadlines,
  onSaveDeadline,
  onDeleteDeadline,
}) => {
  const toast = useToast();
  const pendingDelete = useUndoableDelete<ProgramDeadline>({
    commit: (x) => onDeleteDeadline(x.id),
    message: 'Prazo excluído.',
    errorMessage: 'Não foi possível excluir o prazo. Tente novamente.',
  });
  const deadlines = allDeadlines.filter((x) => !pendingDelete.pendingIds.has(x.id));
  const [isFormOpen, setIsFormOpen] = usePersistedState('gsa_deadline_modal_open', false);
  const [formData, setFormData] = usePersistedState<Partial<ProgramDeadline>>('gsa_deadline_form_draft', DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = usePersistedState('gsa_deadline_show_history', false);
  const [collapsedMonths, setCollapsedMonths] = usePersistedState<string[]>('gsa_deadline_collapsed_months', []);

  const toggleMonthCollapse = (monthKey: string) => {
    setCollapsedMonths((prev) =>
      prev.includes(monthKey) ? prev.filter((key) => key !== monthKey) : [...prev, monthKey],
    );
  };

  const today = todayISO();
  const sortedDeadlines = [...deadlines].sort((a, b) => (a.date < b.date ? -1 : 1));
  const [searchQuery, setSearchQuery] = useUrlState('q');
  const query = searchQuery.trim().toLowerCase();
  const matchedDeadlines = query
    ? sortedDeadlines.filter((d) =>
        [d.title, d.notes, d.category].some((field) => field?.toLowerCase().includes(query)),
      )
    : sortedDeadlines;

  const currentMonthKey = getMonthKey(today);
  const visibleDeadlines = matchedDeadlines.filter((d) => !d.isCompleted || getMonthKey(d.date) >= currentMonthKey);
  const historyDeadlines = matchedDeadlines.filter((d) => d.isCompleted && getMonthKey(d.date) < currentMonthKey);

  const visibleMonthGroups = new Map<string, ProgramDeadline[]>();
  for (const deadline of visibleDeadlines) {
    const key = getMonthKey(deadline.date);
    if (!visibleMonthGroups.has(key)) visibleMonthGroups.set(key, []);
    visibleMonthGroups.get(key)!.push(deadline);
  }
  const visibleMonthKeys = Array.from(visibleMonthGroups.keys());

  const historyMonthGroups = new Map<string, ProgramDeadline[]>();
  for (const deadline of historyDeadlines) {
    const key = getMonthKey(deadline.date);
    if (!historyMonthGroups.has(key)) historyMonthGroups.set(key, []);
    historyMonthGroups.get(key)!.push(deadline);
  }
  const historyMonthKeys = Array.from(historyMonthGroups.keys()).reverse();

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
  };

  const handleEdit = (deadline: ProgramDeadline) => {
    setFormData(deadline);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.date) return;

    setIsSaving(true);
    try {
      const deadline: ProgramDeadline = {
        id: formData.id || crypto.randomUUID(),
        title: formData.title.trim(),
        date: formData.date,
        category: formData.category || 'Outro',
        notes: (formData.notes || '').trim() || undefined,
        points: formData.points ? Number(formData.points) : undefined,
        week: formData.week ? Number(formData.week) : undefined,
        isCompleted: formData.isCompleted ?? false,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveDeadline(deadline);
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível salvar o prazo. Tente novamente.', tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (deadline: ProgramDeadline) => {
    setTogglingId(deadline.id);
    try {
      await onSaveDeadline({ ...deadline, isCompleted: !deadline.isCompleted, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível atualizar o prazo. Tente novamente.', tone: 'error' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (deadline: ProgramDeadline) => pendingDelete.remove(deadline);

  return (
    <div className="space-y-6">
      <PageHeader icon={CalendarClock} iconClassName="text-primary" title="Prazos">
        <Button
          id="btn-new-deadline"
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          aria-label="Novo prazo"
          title="Novo prazo"
          variant="primary"
          collapseLabel
          icon={<Plus className="w-4 h-4" />}
        >
          Novo prazo
        </Button>
      </PageHeader>

      {sortedDeadlines.length > 0 && (
        <div>
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            label="Buscar prazos"
            placeholder="Buscar por título, categoria ou anotação"
          />
        </div>
      )}

      {sortedDeadlines.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          iconClassName="bg-primary/10 text-primary"
          title="Nenhum prazo registrado"
          description="Anote entregas e datas importantes do programa para não perder nenhum prazo."
          action={{
            label: 'Novo prazo',
            onClick: () => {
              resetForm();
              setIsFormOpen(true);
            },
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : matchedDeadlines.length === 0 ? (
        <NoResults
          title="Nenhum prazo encontrado"
          description="Nenhum prazo corresponde à busca."
          onClear={() => setSearchQuery('')}
        />
      ) : (
        <div className="space-y-6">
          {visibleMonthKeys.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum prazo em aberto no momento.</p>
          ) : (
            visibleMonthKeys.map((key) => (
              <MonthGroup
                key={key}
                monthKey={key}
                deadlines={visibleMonthGroups.get(key)!}
                today={today}
                togglingId={togglingId}
                isCollapsed={collapsedMonths.includes(key)}
                onToggleCollapse={() => toggleMonthCollapse(key)}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}

          {historyMonthKeys.length > 0 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                aria-expanded={showHistory}
                className="inline-flex items-center gap-1.5 px-1 text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                <ChevronDown
                  aria-hidden="true"
                  className={`w-4 h-4 transition-transform ${showHistory ? '' : '-rotate-90'}`}
                />
                {showHistory ? 'Ocultar histórico' : `Ver histórico (${historyDeadlines.length})`}
              </button>

              {(showHistory || query) && (
                <div className="space-y-6">
                  {historyMonthKeys.map((key) => (
                    <MonthGroup
                      key={key}
                      monthKey={key}
                      deadlines={historyMonthGroups.get(key)!}
                      today={today}
                      togglingId={togglingId}
                      isCollapsed={collapsedMonths.includes(key)}
                      onToggleCollapse={() => toggleMonthCollapse(key)}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isFormOpen && (
        <DeadlineFormModal
          formData={formData}
          onChange={setFormData}
          isSaving={isSaving}
          onSubmit={handleSubmit}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};
