import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  ListChecks,
  MapPin,
  Pencil,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { HostedEvent } from '../../types';
import { formatDateBR } from '../../utils/date';
import { NumberStepper } from '../NumberStepper';
import {
  CHECKLIST_ITEMS,
  checklistProgress,
  eventStatus,
  hasEnoughParticipants,
  isValidated,
  MIN_PARTICIPANTS,
  STATUS_LABELS,
  VALIDATION_QUESTIONS,
} from './guideContent';
import { CopyButton, LinkButton } from './QuickAccessBar';

interface EventCardProps {
  event: HostedEvent;
  today: string;
  onSave: (event: HostedEvent) => Promise<void>;
  onEdit: (event: HostedEvent) => void;
  onDelete: (event: HostedEvent) => void;
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function EventCard({ event, today, onSave, onEdit, onDelete }: EventCardProps) {
  const [current, setCurrent] = useState(event);
  if (event.id !== current.id || event.updatedAt > current.updatedAt) setCurrent(event);
  const [isOpen, setIsOpen] = useState(() => eventStatus(event, today) !== 'validated');
  const [saveError, setSaveError] = useState(false);

  const update = (patch: Partial<HostedEvent>) => {
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    setCurrent(next);
    setSaveError(false);
    onSave(next).catch((err: unknown) => {
      console.error(err);
      setSaveError(true);
    });
  };

  const status = STATUS_LABELS[eventStatus(current, today)];
  const { done, total } = checklistProgress(current);
  const percent = Math.round((done / total) * 100);
  const validationItems = VALIDATION_QUESTIONS.length + 1;
  const validationDone =
    VALIDATION_QUESTIONS.filter((q) => current.validationDone.includes(q.id)).length +
    (hasEnoughParticipants(current) ? 1 : 0);
  const contentId = `event-${current.id}-details`;

  return (
    <article
      aria-label={current.title}
      className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden"
    >
      <div className="flex items-start gap-3 p-5">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <h4 title={current.title} className="flex-1 sm:flex-initial min-w-0 truncate font-bold text-gray-900">
              {current.title}
            </h4>
            <span
              className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${status.className}`}
            >
              {status.label}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span>{formatDateBR(current.date)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {current.durationMinutes} min
            </span>
            {current.format && <span>{current.format}</span>}
            {current.location && (
              <span className="inline-flex items-center gap-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{current.location}</span>
              </span>
            )}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div
              role="progressbar"
              aria-label={`Checklist de ${current.title}`}
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden"
            >
              <div className="h-full rounded-full bg-[#1A73E8] transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-gray-500 shrink-0">
              {done}/{total}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            )}
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(current)}
            aria-label="Editar evento"
            title="Editar"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(current)}
            aria-label="Excluir evento"
            title="Excluir"
            className="p-2 rounded-xl text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          id={contentId}
          className="border-t border-gray-100 grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100"
        >
          <section aria-label="Checklist" className="p-5">
            <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-[#1A73E8]" />
              Checklist
            </h5>
            <ul className="mt-3 space-y-2">
              {CHECKLIST_ITEMS.map((item) => {
                const checked = current.checklistDone.includes(item.id);
                return (
                  <li key={item.id} className="rounded-2xl border border-gray-100 bg-[#F8FAFD] p-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => update({ checklistDone: toggle(current.checklistDone, item.id) })}
                      className="w-full flex items-start gap-2.5 text-left text-sm"
                    >
                      {checked ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-[#34A853]" />
                      ) : (
                        <Circle className="w-5 h-5 shrink-0 text-gray-300" />
                      )}
                      <span className={checked ? 'text-gray-400 line-through' : 'text-gray-800'}>{item.label}</span>
                    </button>
                    {item.actions && (
                      <div className="mt-2 pl-7.5 flex flex-wrap gap-2">
                        {item.actions.map((action) =>
                          action.kind === 'link' ? (
                            <LinkButton key={action.url} href={action.url} label={action.label} />
                          ) : (
                            <CopyButton key={action.value} value={action.value} label={action.label} />
                          ),
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Validador de evidências" className="p-5">
            <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#34A853]" />
              Validador de evidências (pré check-out)
            </h5>
            <p className="mt-1 text-xs text-gray-500">Preencha logo após o evento, antes de enviar para o Amplifica.</p>

            <div className="mt-3 rounded-2xl border border-gray-100 bg-[#F8FAFD] p-3">
              <label
                htmlFor={`event-${current.id}-participants`}
                className="flex items-center gap-2 text-sm text-gray-800"
              >
                <Users className="w-4 h-4 text-gray-500 shrink-0" />
                Participantes na foto (além de você)
              </label>
              <div className="mt-2 max-w-40">
                <NumberStepper
                  id={`event-${current.id}-participants`}
                  min={0}
                  value={current.participants ?? 0}
                  onChange={(participants) => update({ participants })}
                />
              </div>
              <p
                className={`mt-1.5 text-xs font-medium ${hasEnoughParticipants(current) ? 'text-[#1E8E3E]' : 'text-gray-500'}`}
              >
                {hasEnoughParticipants(current)
                  ? `Mínimo de ${MIN_PARTICIPANTS} atingido`
                  : `Mínimo de ${MIN_PARTICIPANTS} participantes`}
              </p>
            </div>

            <ul className="mt-2 space-y-2">
              {VALIDATION_QUESTIONS.map((question) => {
                const yes = current.validationDone.includes(question.id);
                return (
                  <li
                    key={question.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[#F8FAFD] p-3"
                  >
                    <span id={`event-${current.id}-${question.id}`} className="text-sm text-gray-800">
                      {question.label}
                    </span>
                    <div
                      role="radiogroup"
                      aria-labelledby={`event-${current.id}-${question.id}`}
                      className="flex shrink-0 rounded-full border border-gray-200 bg-white p-0.5"
                    >
                      {[true, false].map((value) => (
                        <button
                          key={String(value)}
                          type="button"
                          role="radio"
                          aria-checked={yes === value}
                          onClick={() => {
                            if (yes !== value) update({ validationDone: toggle(current.validationDone, question.id) });
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            yes === value
                              ? value
                                ? 'bg-[#34A853] text-white'
                                : 'bg-gray-200 text-gray-700'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {value ? 'Sim' : 'Não'}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>

            <p
              role="status"
              className={`mt-3 rounded-2xl px-3.5 py-3 text-sm font-semibold ${
                isValidated(current) ? 'bg-[#34A853]/10 text-[#1E8E3E]' : 'bg-[#FBBC04]/15 text-[#9E5D00]'
              }`}
            >
              {isValidated(current)
                ? 'Tudo certo! Evidências prontas para o check-out.'
                : `${validationDone} de ${validationItems} critérios atendidos. Revise antes de enviar.`}
            </p>
          </section>
        </div>
      )}

      {saveError && (
        <p role="alert" className="px-5 pb-4 text-sm text-[#D93025]">
          Não foi possível salvar a última alteração. Tente novamente.
        </p>
      )}
    </article>
  );
}
