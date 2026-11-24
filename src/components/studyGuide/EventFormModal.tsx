import { CalendarPlus } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Modal, ModalFooter, ModalHeader } from '../ui/Modal';
import type { EventDuration, HostedEvent } from '../../types';
import { DatePicker } from '../DatePicker';
import { EVENT_DURATIONS, EVENT_FORMATS } from './guideContent';

interface EventFormModalProps {
  initial?: HostedEvent;
  onSave: (event: HostedEvent) => Promise<void>;
  onClose: () => void;
}

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-surface-muted placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors';
const choiceClass = (active: boolean) =>
  `px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
    active ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
  }`;

export function EventFormModal({ initial, onSave, onClose }: EventFormModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);
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
    <Modal onClose={onClose} labelledBy="event-form-heading">
      <ModalHeader
        titleId="event-form-heading"
        title={initial ? 'Editar evento' : 'Novo evento'}
        subtitle="O checklist é gerado automaticamente"
        icon={CalendarPlus}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
          <div>
            <label htmlFor="event-form-title" className={labelClass}>
              Tema <span className="text-danger-600">*</span>
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
              Data <span className="text-danger-600">*</span>
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
            <p role="alert" className="text-sm text-danger-600">
              {error}
            </p>
          )}
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
