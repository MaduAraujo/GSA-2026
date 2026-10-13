import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeHostedEvent } from '../../test/factories';
import type { HostedEvent } from '../../types';
import { eventStatus, GEMINI_TEST_URL, OFFICIAL_HASHTAG } from './guideContent';
import { StudyGuideModule } from './StudyGuideModule';

const ALL_CHECKLIST = ['duration', 'slides', 'art', 'post', 'qrcode'];
const ALL_VALIDATION = ['in_person', 'shows_presentation', 'raw_media'];

describe('eventStatus', () => {
  const today = '2026-09-10';

  it('is "planning" for a future event with open checklist items', () => {
    expect(eventStatus(makeHostedEvent({ date: '2026-09-20', checklistDone: ['duration'] }), today)).toBe('planning');
  });

  it('is "ready" for a future event with the whole checklist done', () => {
    expect(eventStatus(makeHostedEvent({ date: '2026-09-20', checklistDone: ALL_CHECKLIST }), today)).toBe('ready');
  });

  it('asks for validation once the event date arrives', () => {
    expect(eventStatus(makeHostedEvent({ date: '2026-09-10' }), today)).toBe('awaitingValidation');
  });

  it('is only "validated" with every answer yes and at least 5 participants', () => {
    const almost = makeHostedEvent({ date: '2026-09-01', validationDone: ALL_VALIDATION, participants: 4 });
    expect(eventStatus(almost, today)).toBe('awaitingValidation');
    expect(eventStatus({ ...almost, participants: 5 }, today)).toBe('validated');
  });
});

describe('StudyGuideModule', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-10T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  const renderModule = (events: HostedEvent[] = [], onSaveEvent = vi.fn().mockResolvedValue(undefined)) => {
    render(<StudyGuideModule events={events} onSaveEvent={onSaveEvent} onDeleteEvent={vi.fn()} />);
    return { onSaveEvent };
  };

  it('shows the 6-step guide, the mandatory validation rules and the compliance limits', () => {
    renderModule();
    const steps = within(screen.getByRole('region', { name: 'Passo a passo de eventos' })).getAllByRole('listitem');
    expect(steps.map((li) => li.querySelector('p')?.textContent)).toEqual([
      'Tema',
      'Formato',
      'Planejamento',
      'Link do App',
      'Divulgação',
      'Registro',
    ]);
    expect(screen.getByText('O evento precisa ser estritamente presencial.')).toBeInTheDocument();
    expect(screen.getByText(/Você não fala em nome do Google/)).toBeInTheDocument();
    const templates = screen.getByRole('region', { name: 'Modelos oficiais' });
    expect(within(templates).getByRole('link', { name: 'Manual da Marca' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Limites de atuação e conformidade' })).queryByRole('link', {
        name: 'Manual da Marca',
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Modelo de Panfleto' })).toHaveAttribute(
      'href',
      expect.stringContaining('docs.google.com/presentation'),
    );
  });

  it('copies the test link and the hashtag from the quick access bar', async () => {
    const user = userEvent.setup();
    renderModule();
    const bar = screen.getByRole('navigation', { name: 'Acesso rápido' });

    await user.click(within(bar).getByRole('button', { name: 'Copiar link de teste' }));
    expect(await navigator.clipboard.readText()).toBe(GEMINI_TEST_URL);
    expect(within(bar).getByText('Copiado!')).toBeInTheDocument();

    await user.click(within(bar).getByRole('button', { name: 'Copiar hashtag' }));
    expect(await navigator.clipboard.readText()).toBe(OFFICIAL_HASHTAG);
    expect(within(bar).getByRole('link', { name: 'Media Kit' })).toHaveAttribute('target', '_blank');
    expect(within(bar).queryByRole('link', { name: 'Manual da Marca' })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Modelos oficiais' })).getByRole('link', { name: 'Manual da Marca' }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining('docs.google.com/presentation/d/e/2PACX-1vTX5jNk96XcLC3DI7ZmkoZ'),
    );
  });

  it('plans a new event with theme, date, duration and format', async () => {
    const user = userEvent.setup();
    const { onSaveEvent } = renderModule();
    await user.click(screen.getByRole('tab', { name: /Meus eventos/ }));
    expect(screen.getByText('Nenhum evento planejado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Novo evento' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelectorAll('[placeholder]:not([placeholder=""])')).toHaveLength(0);
    await user.keyboard('Engenharia de Prompts');
    await user.click(document.getElementById('event-form-date') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '15' }));
    await user.click(within(dialog).getByRole('radio', { name: '45 min' }));
    await user.click(within(dialog).getByRole('radio', { name: 'Workshop' }));
    await user.type(within(dialog).getByLabelText('Local do campus'), 'FAM, sala 204');
    expect(within(dialog).queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    await user.click(dialog.previousElementSibling as HTMLElement);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSaveEvent).toHaveBeenCalledTimes(1));
    expect(onSaveEvent.mock.calls[0]![0]).toMatchObject({
      title: 'Engenharia de Prompts',
      date: '2026-09-15',
      durationMinutes: 45,
      format: 'Workshop',
      location: 'FAM, sala 204',
      checklistDone: [],
      validationDone: [],
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('ticks checklist items and keeps earlier ticks when clicking quickly', async () => {
    const user = userEvent.setup();
    const { onSaveEvent } = renderModule([makeHostedEvent({ date: '2026-09-20' })]);
    await user.click(screen.getByRole('tab', { name: /Meus eventos/ }));

    await user.click(screen.getByRole('checkbox', { name: /Definir duração/ }));
    await user.click(screen.getByRole('checkbox', { name: /hashtag oficial/ }));

    expect(screen.getByRole('checkbox', { name: /Definir duração/ })).toHaveAttribute('aria-checked', 'true');
    expect(onSaveEvent).toHaveBeenLastCalledWith(expect.objectContaining({ checklistDone: ['duration', 'post'] }));
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('validates the evidence before check-out', async () => {
    const user = userEvent.setup();
    const { onSaveEvent } = renderModule([makeHostedEvent({ date: '2026-09-09' })]);
    await user.click(screen.getByRole('tab', { name: /Meus eventos/ }));
    const validator = screen.getByRole('region', { name: 'Validador de evidências' });

    expect(within(validator).getByRole('status')).toHaveTextContent('0 de 4 critérios atendidos');

    await user.click(within(validator).getByRole('spinbutton'));
    await user.keyboard('5');
    for (const group of within(validator).getAllByRole('radiogroup')) {
      await user.click(within(group).getByRole('radio', { name: 'Sim' }));
    }

    expect(within(validator).getByRole('status')).toHaveTextContent('Tudo certo!');
    expect(screen.getByText('Pronto p/ check-out')).toBeInTheDocument();
    expect(onSaveEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({ participants: 5, validationDone: ALL_VALIDATION }),
    );
  });
});
