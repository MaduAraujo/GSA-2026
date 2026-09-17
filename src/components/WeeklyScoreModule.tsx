import React, { useEffect, useState } from 'react';
import { Trophy, Plus, X, Trash2, Pencil, Loader2, StickyNote } from 'lucide-react';
import { WeeklyScore } from '../types';
import { DatePicker } from './DatePicker';
import { NumberStepper } from './NumberStepper';
import { usePersistedState } from '../hooks/usePersistedState';

interface WeeklyScoreModuleProps {
  weeklyScores: WeeklyScore[];
  onSaveWeeklyScore: (weeklyScore: WeeklyScore) => Promise<void>;
  onDeleteWeeklyScore: (id: string) => Promise<void>;
}

const DEFAULT_FORM: Partial<WeeklyScore> = {
  weekStart: '',
  weekEnd: '',
  points: undefined,
  notes: '',
};

function formatDateBR(isoDate?: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}`;
}

export const WeeklyScoreModule: React.FC<WeeklyScoreModuleProps> = ({
  weeklyScores,
  onSaveWeeklyScore,
  onDeleteWeeklyScore,
}) => {
  const [isFormOpen, setIsFormOpen] = usePersistedState('gsa_weekly_score_modal_open', false);
  const [formData, setFormData] = usePersistedState<Partial<WeeklyScore>>('gsa_weekly_score_form_draft', DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [openDateField, setOpenDateField] = useState<'start' | 'end' | null>(null);

  const sortedScores = [...weeklyScores].sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setFormError(null);
  };

  const handleEdit = (weeklyScore: WeeklyScore) => {
    setFormData(weeklyScore);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.weekStart || !formData.weekEnd || formData.points === undefined) return;
    if (formData.weekEnd < formData.weekStart) {
      setFormError('A data final não pode ser antes da data inicial.');
      return;
    }

    setIsSaving(true);
    try {
      const weeklyScore: WeeklyScore = {
        id: formData.id || crypto.randomUUID(),
        weekStart: formData.weekStart,
        weekEnd: formData.weekEnd,
        points: formData.points,
        notes: (formData.notes || '').trim() || undefined,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveWeeklyScore(weeklyScore);
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Não foi possível salvar a pontuação. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (weeklyScore: WeeklyScore) => {
    if (!confirm('Deseja realmente remover esta pontuação semanal?')) return;
    setDeletingId(weeklyScore.id);
    try {
      await onDeleteWeeklyScore(weeklyScore.id);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir a pontuação. Tente novamente.');
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
            <Trophy className="w-6 h-6 text-[#FBBC04]" />
            <span>Pontuação Semanal</span>
          </h2>
        </div>

        <button
          id="btn-new-weekly-score"
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          aria-label="Nova pontuação semanal"
          title="Nova pontuação semanal"
          className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova semana</span>
        </button>
      </div>

      {sortedScores.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FBBC04]/10 text-[#F9AB00] flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhuma pontuação registrada</h3>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs divide-y divide-gray-100">
          {sortedScores.map((weeklyScore) => (
            <div
              key={weeklyScore.id}
              id={`weekly-score-row-${weeklyScore.id}`}
              className="flex items-center gap-4 p-5 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#FBBC04]/10 text-[#F9AB00] flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 leading-snug">
                  {formatDateBR(weeklyScore.weekStart)} a {formatDateBR(weeklyScore.weekEnd)}
                </p>
                {weeklyScore.notes && (
                  <p className="text-xs text-gray-500 flex items-start gap-1.5 mt-1">
                    <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{weeklyScore.notes}</span>
                  </p>
                )}
              </div>

              <p className="text-lg font-bold text-[#F9AB00] shrink-0">{weeklyScore.points} pts</p>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleEdit(weeklyScore)}
                  aria-label="Editar pontuação"
                  title="Editar"
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(weeklyScore)}
                  disabled={deletingId === weeklyScore.id}
                  aria-label="Excluir pontuação"
                  title="Excluir"
                  className="p-2 rounded-xl text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 disabled:opacity-50"
                >
                  {deletingId === weeklyScore.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FBBC04]/10 text-[#F9AB00] flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {formData.id ? 'Editar Pontuação' : 'Nova Pontuação Semanal'}
                    </h3>
                    <p className="text-xs text-gray-500">Registre quantos pontos você recebeu na semana</p>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Início da semana *
                    </label>
                    <DatePicker
                      id="weekly-score-form-start"
                      value={formData.weekStart || ''}
                      onChange={(date) => setFormData({ ...formData, weekStart: date })}
                      open={openDateField === 'start'}
                      onOpenChange={(isOpen) => setOpenDateField(isOpen ? 'start' : null)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Fim da semana *
                    </label>
                    <DatePicker
                      id="weekly-score-form-end"
                      value={formData.weekEnd || ''}
                      onChange={(date) => setFormData({ ...formData, weekEnd: date })}
                      open={openDateField === 'end'}
                      onOpenChange={(isOpen) => setOpenDateField(isOpen ? 'end' : null)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Pontuação *
                  </label>
                  <NumberStepper
                    id="weekly-score-form-points"
                    min={0}
                    value={formData.points ?? 0}
                    onChange={(points) => setFormData({ ...formData, points })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Ex: pontos por posts e presença nas sessões"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#FBBC04]/40 resize-none"
                  />
                </div>

                {formError && (
                  <p role="alert" className="text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5">
                    {formError}
                  </p>
                )}

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSaving || !formData.weekStart || !formData.weekEnd || formData.points === undefined}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#F9AB00] hover:bg-[#E8A000] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
