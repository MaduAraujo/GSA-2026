import React, { useEffect, useState } from 'react';
import { CalendarClock, Plus, X, Trash2, Pencil, Loader2, StickyNote, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { DeadlineCategory, ProgramDeadline } from '../types';
import { DatePicker } from './DatePicker';
import { usePersistedState } from '../hooks/usePersistedState';

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
  category: 'Desafio',
  notes: '',
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

export const DeadlinesModule: React.FC<DeadlinesModuleProps> = ({ deadlines, onSaveDeadline, onDeleteDeadline }) => {
  const [isFormOpen, setIsFormOpen] = usePersistedState('gsa_deadline_modal_open', false);
  const [formData, setFormData] = usePersistedState<Partial<ProgramDeadline>>('gsa_deadline_form_draft', DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const today = todayISO();
  const sortedDeadlines = [...deadlines].sort((a, b) => (a.date < b.date ? -1 : 1));
  const completedCount = deadlines.filter((d) => d.isCompleted).length;
  const progressPercent = deadlines.length > 0 ? Math.round((completedCount / deadlines.length) * 100) : 0;

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

      {deadlines.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">
              {completedCount} de {deadlines.length} prazo{deadlines.length === 1 ? '' : 's'} cumprido{deadlines.length === 1 ? '' : 's'}
            </span>
            <span className="font-bold text-[#1E8E3E]">{progressPercent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso de prazos cumpridos"
            className="h-2.5 rounded-full bg-gray-100 overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-[#34A853] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {sortedDeadlines.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EA4335]/10 text-[#D93025] flex items-center justify-center mx-auto">
            <CalendarClock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum prazo registrado</h3>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs divide-y divide-gray-100">
          {sortedDeadlines.map((deadline) => {
            const isOverdue = !deadline.isCompleted && deadline.date < today;
            const categoryStyle = CATEGORY_STYLES[deadline.category] || CATEGORY_STYLES.Outro;
            return (
              <div
                key={deadline.id}
                id={`deadline-row-${deadline.id}`}
                className="flex items-center gap-4 p-5 group"
              >
                <button
                  onClick={() => handleToggleComplete(deadline)}
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
                    {isOverdue && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EA4335]/10 text-[#D93025] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Atrasado
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
                    onClick={() => handleEdit(deadline)}
                    aria-label="Editar prazo"
                    title="Editar"
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(deadline)}
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
                    placeholder="Ex: Entrega do desafio de comunidade"
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
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Categoria
                    </label>
                    <select
                      value={formData.category || 'Outro'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as DeadlineCategory })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#EA4335]/30"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Ex: enviar link do post junto com a entrega"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#EA4335]/30 resize-none"
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCompleted ?? false}
                    onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#34A853] focus:ring-[#34A853]/30"
                  />
                  <span className="text-sm text-gray-700">Concluído</span>
                </label>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
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
