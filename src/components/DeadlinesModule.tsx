import React, { useEffect, useState } from 'react';
import { CalendarClock, Plus, X, Trash2, Pencil, Loader2, StickyNote, CheckCircle2, Circle, AlertCircle, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { DeadlineCategory, ProgramDeadline } from '../types';
import { DatePicker } from './DatePicker';
import { usePersistedState } from '../hooks/usePersistedState';
import { SelectDropdown } from './SelectDropdown';
import { NumberStepper } from './NumberStepper';

interface DeadlinesModuleProps {
  deadlines: ProgramDeadline[];
  onSaveDeadline: (deadline: ProgramDeadline) => Promise<void>;
  onDeleteDeadline: (id: string) => Promise<void>;
}

const CATEGORIES: DeadlineCategory[] = ['Desafio', 'Sessão', 'Post', 'Outro'];

const CATEGORY_STYLES: Record<DeadlineCategory, { bg: string; text: string }> = {
  'Desafio': { bg: 'bg-[#34A853]/10', text: 'text-[#1E8E3E]' },
  'Sessão': { bg: 'bg-[#1A73E8]/10', text: 'text-[#1A73E8]' },
  'Post': { bg: 'bg-[#EA4335]/10', text: 'text-[#D93025]' },
  'Outro': { bg: 'bg-gray-100', text: 'text-gray-600' },
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

function formatDateBR(isoDate?: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

interface MonthGroupProps {
  monthKey: string;
  deadlines: ProgramDeadline[];
  today: string;
  togglingId: string | null;
  deletingId: string | null;
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
  deletingId,
  isCollapsed,
  onToggleCollapse,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const monthPoints = deadlines.reduce((sum, d) => sum + (d.points || 0), 0);
  const monthCompletedCount = deadlines.filter((d) => d.isCompleted).length;
  const monthProgressPercent = deadlines.length > 0 ? Math.round((monthCompletedCount / deadlines.length) * 100) : 0;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? `Expandir ${formatMonthLabel(monthKey)}` : `Recolher ${formatMonthLabel(monthKey)}`}
        className="w-full flex items-center justify-between gap-2 px-1 py-1 group"
      >
        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-700">
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronUp className="w-3.5 h-3.5 shrink-0" />}
          {formatMonthLabel(monthKey)}
          <span className="normal-case font-medium text-gray-400">({deadlines.length})</span>
        </span>
        {monthPoints > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#9E5D00]">
            <Star className="w-3.5 h-3.5 fill-[#FBBC04] text-[#FBBC04]" />
            {monthPoints} pts
          </span>
        )}
      </button>

      <div className="bg-white rounded-2xl border border-gray-200/70 px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-600">
            {monthCompletedCount} de {deadlines.length} prazo{deadlines.length === 1 ? '' : 's'} cumprido{deadlines.length === 1 ? '' : 's'}
          </span>
          <span className="font-bold text-[#1E8E3E]">{monthProgressPercent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={monthProgressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso de prazos cumpridos em ${formatMonthLabel(monthKey)}`}
          className="h-2 rounded-full bg-gray-100 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-[#34A853] transition-all duration-300"
            style={{ width: `${monthProgressPercent}%` }}
          />
        </div>
      </div>

      {!isCollapsed && (
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs divide-y divide-gray-100">
        {deadlines.map((deadline) => {
          const isOverdue = !deadline.isCompleted && deadline.date < today;
          const categoryStyle = CATEGORY_STYLES[deadline.category] || CATEGORY_STYLES.Outro;
          return (
            <div
              key={deadline.id}
              id={`deadline-row-${deadline.id}`}
              className="flex items-center gap-4 p-5 group"
            >
              <button
                onClick={() => onToggleComplete(deadline)}
                disabled={togglingId === deadline.id}
                aria-label={deadline.isCompleted ? 'Marcar como pendente' : 'Marcar como concluído'}
                title={deadline.isCompleted ? 'Marcar como pendente' : 'Marcar como concluído'}
                className="shrink-0 text-gray-300 hover:text-[#34A853] disabled:opacity-50"
              >
                {togglingId === deadline.id ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : deadline.isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-[#34A853]" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-bold leading-snug ${deadline.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {deadline.title}
                  </p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
                    {deadline.category}
                  </span>
                  {typeof deadline.week === 'number' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Semana {deadline.week}
                    </span>
                  )}
                  {isOverdue && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EA4335]/10 text-[#D93025] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Atrasado
                    </span>
                  )}
                  {typeof deadline.points === 'number' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#9E5D00]">
                      <Star className="w-3.5 h-3.5 fill-[#FBBC04] text-[#FBBC04]" />
                      {deadline.points} pts
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{formatDateBR(deadline.date)}</p>
                {deadline.notes && (
                  <p className="text-xs text-gray-500 flex items-start gap-1.5 mt-1">
                    <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{deadline.notes}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(deadline)}
                  aria-label="Editar prazo"
                  title="Editar"
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(deadline)}
                  disabled={deletingId === deadline.id}
                  aria-label="Excluir prazo"
                  title="Excluir"
                  className="p-2 rounded-xl text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 disabled:opacity-50"
                >
                  {deletingId === deadline.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

export const DeadlinesModule: React.FC<DeadlinesModuleProps> = ({ deadlines, onSaveDeadline, onDeleteDeadline }) => {
  const [isFormOpen, setIsFormOpen] = usePersistedState('gsa_deadline_modal_open', false);
  const [formData, setFormData] = usePersistedState<Partial<ProgramDeadline>>('gsa_deadline_form_draft', DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = usePersistedState('gsa_deadline_show_history', false);
  const [collapsedMonths, setCollapsedMonths] = usePersistedState<string[]>('gsa_deadline_collapsed_months', []);

  const toggleMonthCollapse = (monthKey: string) => {
    setCollapsedMonths((prev) =>
      prev.includes(monthKey) ? prev.filter((key) => key !== monthKey) : [...prev, monthKey]
    );
  };

  const today = todayISO();
  const sortedDeadlines = [...deadlines].sort((a, b) => (a.date < b.date ? -1 : 1));

  const currentMonthKey = getMonthKey(today);
  const visibleDeadlines = sortedDeadlines.filter((d) => !d.isCompleted || getMonthKey(d.date) >= currentMonthKey);
  const historyDeadlines = sortedDeadlines.filter((d) => d.isCompleted && getMonthKey(d.date) < currentMonthKey);

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
  const pastCount = historyDeadlines.length;

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
      alert('Não foi possível salvar o prazo. Tente novamente.');
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
      alert('Não foi possível atualizar o prazo. Tente novamente.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (deadline: ProgramDeadline) => {
    if (!confirm('Deseja realmente remover este prazo?')) return;
    setDeletingId(deadline.id);
    try {
      await onDeleteDeadline(deadline.id);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir o prazo. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!isFormOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFormOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFormOpen]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-[#EA4335]" />
            <span>Prazos</span>
          </h2>
        </div>

        <button
          id="btn-new-deadline"
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          aria-label="Novo prazo"
          title="Novo prazo"
          className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo prazo</span>
        </button>
      </div>

      {sortedDeadlines.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EA4335]/10 text-[#D93025] flex items-center justify-center mx-auto">
            <CalendarClock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum prazo registrado</h3>
        </div>
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
                deletingId={deletingId}
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-gray-300 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showHistory ? 'Ocultar histórico' : `Ver histórico (${pastCount} prazo${pastCount === 1 ? '' : 's'})`}
              </button>

              {showHistory && (
                <div className="space-y-6">
                  {historyMonthKeys.map((key) => (
                    <MonthGroup
                      key={key}
                      monthKey={key}
                      deadlines={historyMonthGroups.get(key)!}
                      today={today}
                      togglingId={togglingId}
                      deletingId={deletingId}
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EA4335]/10 text-[#D93025] flex items-center justify-center">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {formData.id ? 'Editar Prazo' : 'Novo Prazo'}
                    </h3>
                    <p className="text-xs text-gray-500">Registre datas importantes do programa</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  aria-label="Fechar"
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#EA4335]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Data *
                    </label>
                    <DatePicker
                      id="deadline-form-date"
                      value={formData.date || ''}
                      onChange={(date) => setFormData({ ...formData, date })}
                      placeholder="Selecione"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Categoria
                    </label>
                    <SelectDropdown
                      value={formData.category || ''}
                      onChange={(v) => setFormData({ ...formData, category: v as DeadlineCategory })}
                      options={CATEGORIES.map((category) => ({ value: category, label: category }))}
                      ariaLabel="Categoria"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#EA4335]/30 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Semana
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.week ?? ''}
                      onChange={(e) => setFormData({ ...formData, week: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#EA4335]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Pontos
                    </label>
                    <NumberStepper
                      id="deadline-form-points"
                      min={0}
                      value={formData.points ?? 0}
                      onChange={(points) => setFormData({ ...formData, points })}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isCompleted: !(formData.isCompleted ?? false) })}
                  aria-pressed={formData.isCompleted ?? false}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    formData.isCompleted
                      ? 'bg-[#34A853]/10 border-[#34A853]/30 text-[#1E8E3E]'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {formData.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  Concluído
                </button>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSaving || !formData.title?.trim() || !formData.date}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#D93025] hover:bg-[#B3241C] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
