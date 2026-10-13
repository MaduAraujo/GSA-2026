import { CalendarClock, FileText, Flag, GraduationCap, Loader2, StickyNote, X } from 'lucide-react';
import { useEffect, useRef, type FormEvent } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { DeadlineCategory, ProgramDeadline } from '../../types';
import { addDaysISO, todayISO } from '../../utils/date';
import { DatePicker } from '../DatePicker';
import { NumberStepper } from '../NumberStepper';

const NOTES_MAX_LENGTH = 500;

const CATEGORY_OPTIONS: Array<{ value: DeadlineCategory; icon: typeof Flag; active: string }> = [
  { value: 'Desafio', icon: Flag, active: 'bg-[#34A853]/10 border-[#34A853]/40 text-[#1E8E3E]' },
  { value: 'Sessão', icon: GraduationCap, active: 'bg-[#1A73E8]/10 border-[#1A73E8]/40 text-[#1A73E8]' },
  { value: 'Post', icon: FileText, active: 'bg-[#EA4335]/10 border-[#EA4335]/40 text-[#D93025]' },
  { value: 'Outro', icon: StickyNote, active: 'bg-gray-100 border-gray-300 text-gray-700' },
];

interface DeadlineFormModalProps {
  formData: Partial<ProgramDeadline>;
  onChange: (formData: Partial<ProgramDeadline>) => void;
  isSaving: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

const labelClass = 'block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD] placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#EA4335] focus:ring-2 focus:ring-[#EA4335]/20 transition-colors';
const chipClass = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
    active
      ? 'bg-[#EA4335]/10 border-[#EA4335]/40 text-[#D93025]'
      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
  }`;

export function DeadlineFormModal({ formData, onChange, isSaving, onSubmit, onClose }: DeadlineFormModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  useFocusTrap(dialogRef, onClose);

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in">
      <div aria-hidden="true" className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deadline-form-heading"
        className="relative bg-white w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EA4335]/10 text-[#D93025] flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 id="deadline-form-heading" className="text-lg font-bold text-gray-900 truncate">
                {isEdit ? 'Editar Prazo' : 'Novo Prazo'}
              </h3>
              <p className="text-xs text-gray-500">Registre datas importantes do programa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
            <div>
              <label htmlFor="deadlines-titulo" className={labelClass}>
                Título <span className="text-[#D93025]">*</span>
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
                Data <span className="text-[#D93025]">*</span>
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
                <p className="mt-1 text-[11px] text-gray-400">Opcional (0 = sem semana)</p>
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
                <span className="text-[11px] text-gray-400" aria-live="polite">
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
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 bg-[#F8FAFD] cursor-pointer"
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
                  formData.isCompleted ? 'bg-[#34A853]' : 'bg-gray-300'
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

          <footer className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving || !canSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#D93025] hover:bg-[#B3241C] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
