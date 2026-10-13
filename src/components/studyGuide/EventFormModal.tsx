import { CalendarPlus, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { EventDuration, HostedEvent } from '../../types';
import { DatePicker } from '../DatePicker';
import { EVENT_DURATIONS, EVENT_FORMATS } from './guideContent';

interface EventFormModalProps {
  initial?: HostedEvent;
  onSave: (event: HostedEvent) => Promise<void>;
  onClose: () => void;
}

const labelClass = 'block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD] placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 transition-colors';
const choiceClass = (active: boolean) =>
  `px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
    active
      ? 'bg-[#1A73E8]/10 border-[#1A73E8]/40 text-[#1A73E8]'
      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
  }`;

export function EventFormModal({ initial, onSave, onClose }: EventFormModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  useFocusTrap(dialogRef, onClose);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [durationMinutes, setDurationMinutes] = useState<EventDuration>(initial?.durationMinutes ?? 60);
  const [format, setFormat] = useState(initial?.format ?? EVENT_FORMATS[0]!);
  const [location, setLocation] = useState(initial?.location ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(title.trim() && date);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    setError(null);
    const now = new Date().toISOString();
    try {
      await onSave({
        id: initial?.id ?? crypto.randomUUID(),
        title: title.trim(),
        date,
        durationMinutes,
        format,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        participants: initial?.participants,
        checklistDone: initial?.checklistDone ?? [],
        validationDone: initial?.validationDone ?? [],
        createdAt: initial?.createdAt ?? now,
        updatedAt: now,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Não foi possível salvar o evento. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in">
      <div aria-hidden="true" className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-form-heading"
        className="relative bg-white w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center shrink-0">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 id="event-form-heading" className="text-lg font-bold text-gray-900 truncate">
                {initial ? 'Editar evento' : 'Novo evento'}
              </h3>
              <p className="text-xs text-gray-500">O checklist é gerado automaticamente</p>
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

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
            <div>
              <label htmlFor="event-form-title" className={labelClass}>
                Tema <span className="text-[#D93025]">*</span>
              </label>
              <input
                ref={titleRef}
                id="event-form-title"
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="event-form-date" className={labelClass}>
                Data <span className="text-[#D93025]">*</span>
              </label>
              <DatePicker id="event-form-date" value={date} onChange={setDate} placeholder="" />
            </div>

            <fieldset>
              <legend className={labelClass}>Duração</legend>
              <div role="radiogroup" aria-label="Duração" className="grid grid-cols-3 gap-2">
                {EVENT_DURATIONS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    role="radio"
                    aria-checked={durationMinutes === minutes}
                    onClick={() => setDurationMinutes(minutes)}
                    className={choiceClass(durationMinutes === minutes)}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={labelClass}>Formato</legend>
              <div role="radiogroup" aria-label="Formato" className="grid grid-cols-2 gap-2">
                {EVENT_FORMATS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={format === option}
                    onClick={() => setFormat(option)}
                    className={choiceClass(format === option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="event-form-location" className={labelClass}>
                Local do campus
              </label>
              <input
                id="event-form-location"
                type="text"
                maxLength={120}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="event-form-notes" className={labelClass}>
                Observações
              </label>
              <textarea
                id="event-form-notes"
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-[#D93025]">
                {error}
              </p>
            )}
          </div>

          <footer className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving || !canSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1A73E8] hover:bg-[#1765CC] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
