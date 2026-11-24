import { CalendarClock, FileText, Flag, GraduationCap, StickyNote } from 'lucide-react';
import { useEffect, useRef, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Modal, ModalFooter, ModalHeader } from '../ui/Modal';
import type { DeadlineCategory, ProgramDeadline } from '../../types';
import { addDaysISO, todayISO } from '../../utils/date';
import { DatePicker } from '../DatePicker';
import { NumberStepper } from '../NumberStepper';

const NOTES_MAX_LENGTH = 500;

const CATEGORY_OPTIONS: Array<{ value: DeadlineCategory; icon: typeof Flag; active: string }> = [
  { value: 'Desafio', icon: Flag, active: 'bg-success/10 border-success/40 text-success-700' },
  { value: 'Sessão', icon: GraduationCap, active: 'bg-primary/10 border-primary/40 text-primary' },
  { value: 'Post', icon: FileText, active: 'bg-danger/10 border-danger/40 text-danger-600' },
  { value: 'Outro', icon: StickyNote, active: 'bg-gray-100 border-gray-300 text-gray-700' },
];

interface DeadlineFormModalProps {
  formData: Partial<ProgramDeadline>;
  onChange: (formData: Partial<ProgramDeadline>) => void;
  isSaving: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-surface-muted placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-danger focus-visible:ring-2 focus-visible:ring-danger/20 transition-colors';
const chipClass = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
    active ? 'bg-danger/10 border-danger/40 text-danger-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
  }`;

export function DeadlineFormModal({ formData, onChange, isSaving, onSubmit, onClose }: DeadlineFormModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const set = (patch: Partial<ProgramDeadline>) => onChange({ ...formData, ...patch });
  const today = todayISO();
  const dateShortcuts = [
    { label: 'Hoje', date: today },
    { label: 'Amanhã', date: addDaysISO(today, 1) },
    { label: 'Em 7 dias', date: addDaysISO(today, 7) },
  ];
  const isEdit = Boolean(formData.id);
  const canSubmit = Boolean(formData.title?.trim() && formData.date);
  const notesLength = formData.notes?.length ?? 0;

  return (
    <Modal onClose={onClose} labelledBy="deadline-form-heading">
      <ModalHeader
        titleId="deadline-form-heading"
        title={isEdit ? 'Editar Prazo' : 'Novo Prazo'}
        subtitle="Registre datas importantes do programa"
        icon={CalendarClock}
        iconClassName="bg-primary/10 text-primary"
        onClose={onClose}
      />

      <form onSubmit={onSubmit} className="flex flex-col min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
          <div>
            <label htmlFor="deadlines-titulo" className={labelClass}>
              Título <span className="text-danger-600">*</span>
            </label>
            <input
              ref={titleRef}
              id="deadlines-titulo"
              type="text"
              required
              maxLength={120}
              placeholder="Ex.: Entrega do desafio da semana"
              value={formData.title || ''}
              onChange={(e) => set({ title: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="deadline-form-date" className={labelClass}>
              Data <span className="text-danger-600">*</span>
            </label>
            <DatePicker
              id="deadline-form-date"
              value={formData.date || ''}
              onChange={(date) => set({ date })}
              placeholder="Selecione uma data"
            />
            <div className="mt-2 flex flex-wrap gap-2" aria-label="Atalhos de data">
              {dateShortcuts.map((shortcut) => (
                <button
                  key={shortcut.label}
                  type="button"
                  onClick={() => set({ date: shortcut.date })}
                  aria-pressed={formData.date === shortcut.date}
                  className={chipClass(formData.date === shortcut.date)}
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          <fieldset>
            <legend className={labelClass}>Categoria</legend>
            <div role="radiogroup" aria-label="Categoria" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORY_OPTIONS.map(({ value, icon: Icon, active }) => {
                const isActive = (formData.category || 'Outro') === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => set({ category: value })}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                      isActive ? active : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="deadlines-semana" className={labelClass}>
                Semana
              </label>
              <NumberStepper
                id="deadlines-semana"
                min={0}
                value={formData.week ?? 0}
                onChange={(week) => set({ week: week || undefined })}
              />
              <p className="mt-1 text-2xs text-gray-400">Opcional (0 = sem semana)</p>
            </div>
            <div>
              <label htmlFor="deadline-form-points" className={labelClass}>
                Pontos
              </label>
              <NumberStepper
                id="deadline-form-points"
                min={0}
                value={formData.points ?? 0}
                onChange={(points) => set({ points })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="deadlines-observacoes" className={labelClass}>
                Observações
              </label>
              <span className="text-2xs text-gray-400" aria-live="polite">
                {notesLength}/{NOTES_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="deadlines-observacoes"
              rows={3}
              maxLength={NOTES_MAX_LENGTH}
              placeholder="Detalhes, links ou lembretes"
              value={formData.notes || ''}
              onChange={(e) => set({ notes: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </div>

          <label
            htmlFor="deadline-form-completed"
            className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 bg-surface-muted cursor-pointer"
          >
            <span>
              <span className="block text-sm font-semibold text-gray-800">Concluído</span>
              <span className="block text-xs text-gray-500">Marque se este prazo já foi cumprido</span>
            </span>
            <button
              id="deadline-form-completed"
              type="button"
              role="switch"
              aria-checked={formData.isCompleted ?? false}
              onClick={() => set({ isCompleted: !(formData.isCompleted ?? false) })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                formData.isCompleted ? 'bg-success' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  formData.isCompleted ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        </div>

        <ModalFooter>
          <Button type="submit" variant="primary" loading={isSaving} disabled={!canSubmit}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
