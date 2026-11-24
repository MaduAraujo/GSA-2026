import React, { useEffect, useState } from 'react';
import { useUndoableDelete } from '../hooks/useUndoableDelete';
import { useToast } from '../app/ToastProvider';
import { ActionMenu } from './ActionMenu';
import { buttonClasses } from './ui/buttonClasses';
import { EmptyState } from './ui/EmptyState';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Modal, ModalHeader } from './ui/Modal';
import { Trophy, Plus, Trash2, Pencil, Loader2, StickyNote } from 'lucide-react';
import { type WeeklyScore } from '../types';
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
  weeklyScores: allWeeklyScores,
  onSaveWeeklyScore,
  onDeleteWeeklyScore,
}) => {
  const toast = useToast();
  const pendingDelete = useUndoableDelete<WeeklyScore>({
    commit: (x) => onDeleteWeeklyScore(x.id),
    message: 'Pontuação excluída.',
    errorMessage: 'Não foi possível excluir a pontuação. Tente novamente.',
  });
  const weeklyScores = allWeeklyScores.filter((x) => !pendingDelete.pendingIds.has(x.id));
  const [isFormOpen, setIsFormOpen] = usePersistedState('gsa_weekly_score_modal_open', false);
  const [formData, setFormData] = usePersistedState<Partial<WeeklyScore>>('gsa_weekly_score_form_draft', DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
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
      toast.show({ message: 'Não foi possível salvar a pontuação. Tente novamente.', tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (weeklyScore: WeeklyScore) => pendingDelete.remove(weeklyScore);

  useEffect(() => {
    if (!isFormOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFormOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFormOpen, setIsFormOpen]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Trophy} iconClassName="text-primary" title="Pontuação Semanal">
        <Button
          id="btn-new-weekly-score"
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          aria-label="Nova pontuação semanal"
          title="Nova pontuação semanal"
          variant="primary"
          collapseLabel
          icon={<Plus className="w-4 h-4" />}
        >
          Nova semana
        </Button>
      </PageHeader>

      {sortedScores.length === 0 ? (
        <EmptyState
          icon={Trophy}
          iconClassName="bg-primary/10 text-primary"
          title="Nenhuma pontuação registrada"
          description="Registre os pontos de cada semana para acompanhar sua evolução no ranking."
          action={{
            label: 'Nova pontuação',
            onClick: () => {
              resetForm();
              setIsFormOpen(true);
            },
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs divide-y divide-gray-100">
          {sortedScores.map((weeklyScore) => (
            <div
              key={weeklyScore.id}
              id={`weekly-score-row-${weeklyScore.id}`}
              className="flex items-center gap-4 p-5 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-warning/10 text-warning-600 flex items-center justify-center shrink-0">
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

              <p className="text-lg font-bold text-warning-600 shrink-0">{weeklyScore.points} pts</p>

              <ActionMenu
                label={`Mais ações para a semana de ${formatDateBR(weeklyScore.weekStart)}`}
                items={[
                  { label: 'Editar', icon: Pencil, onSelect: () => handleEdit(weeklyScore) },
                  { label: 'Excluir', icon: Trash2, tone: 'danger', onSelect: () => handleDelete(weeklyScore) },
                ]}
              />
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <Modal onClose={() => setIsFormOpen(false)} labelledBy="weekly-score-form-heading">
          <ModalHeader
            titleId="weekly-score-form-heading"
            title={formData.id ? 'Editar Pontuação' : 'Nova Pontuação Semanal'}
            subtitle="Registre quantos pontos você recebeu na semana"
            icon={Trophy}
            iconClassName="bg-primary/10 text-primary"
            onClose={() => setIsFormOpen(false)}
          />
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="weekly-score-form-start" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label htmlFor="weekly-score-form-end" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="weekly-score-form-points" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="weeklyscore-observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  id="weeklyscore-observacoes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Ex: pontos por posts e presença nas sessões"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus-visible:ring-2 focus-visible:ring-warning/40 resize-none"
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-danger-600 bg-danger/10 border border-danger/20 rounded-xl px-3.5 py-2.5"
                >
                  {formError}
                </p>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSaving || !formData.weekStart || !formData.weekEnd || formData.points === undefined}
                  className={buttonClasses({ variant: 'primary' })}
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
