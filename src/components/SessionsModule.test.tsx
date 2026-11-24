import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionsModule } from './SessionsModule';
import { type AmbassadorSession } from '../types';
import { makeSession } from '../test/factories';
import { renderModule } from '../test/render';
import { formatDateBR, todayISO } from '../utils/date';

describe('SessionsModule', () => {
  beforeEach(() => sessionStorage.clear());

  it('shows an empty state when there are no sessions', () => {
    renderModule(<SessionsModule sessions={[]} onSaveSession={vi.fn()} onDeleteSession={vi.fn()} />);
    expect(screen.getByText('Nenhum item em Sessões')).toBeInTheDocument();
  });

  it('filters sessions by title, challenge or tool learned', async () => {
    const user = userEvent.setup();
    renderModule(
      <SessionsModule
        sessions={[
          makeSession({ id: 's1', title: 'Mentoria Gemini', toolLearned: 'Gemini' }),
          makeSession({ id: 's2', title: 'Encontro local', toolLearned: 'Canva' }),
        ]}
        onSaveSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText('Buscar sessões'), 'gemini');
    expect(screen.getByText('Mentoria Gemini')).toBeInTheDocument();
    expect(screen.queryByText('Encontro local')).not.toBeInTheDocument();
  });

  it('starts a new record dated today and keeps Salvar disabled until there is a title', async () => {
    const user = userEvent.setup();
    renderModule(<SessionsModule sessions={[]} onSaveSession={vi.fn()} onDeleteSession={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova Sessão'));

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    expect(document.getElementById('session-form-date')).toHaveTextContent(formatDateBR(todayISO()));

    const titleInput = within(screen.getByRole('dialog')).getAllByRole('textbox')[0]!;
    await user.type(titleInput, 'Sessão de mentoria');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });

  it('creates a session with the selected date and trimmed title', async () => {
    const user = userEvent.setup();
    const onSaveSession = vi.fn().mockResolvedValue(undefined);
    renderModule(<SessionsModule sessions={[]} onSaveSession={onSaveSession} onDeleteSession={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova Sessão'));

    const titleInput = within(screen.getByRole('dialog')).getAllByRole('textbox')[0]!;
    await user.type(titleInput, '  Sessão com o time  ');
    await user.click(document.getElementById('session-form-date') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '15' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSaveSession).toHaveBeenCalledTimes(1));
    const saved = onSaveSession.mock.calls[0]![0] as AmbassadorSession;
    expect(saved.title).toBe('Sessão com o time');
    expect(saved.date).toMatch(/^\d{4}-\d{2}-15$/);
  });

  it('rejects a challenge attachment larger than 8MB', async () => {
    const user = userEvent.setup();
    renderModule(<SessionsModule sessions={[]} onSaveSession={vi.fn()} onDeleteSession={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova Sessão'));

    const bigFile = new File([new Uint8Array(9 * 1024 * 1024)], 'grande.pdf', { type: 'application/pdf' });
    const [challengeFileInput] = document.querySelectorAll('input[type="file"]');
    await user.upload(challengeFileInput as HTMLInputElement, bigFile);

    expect(await screen.findByRole('alert')).toHaveTextContent(/muito grande/);
  });

  it('hides a deleted item right away and lets the user undo it', async () => {
    const user = userEvent.setup();
    const onDeleteSession = vi.fn();
    renderModule(
      <SessionsModule
        sessions={[makeSession({ title: 'Sessão X' })]}
        onSaveSession={vi.fn()}
        onDeleteSession={onDeleteSession}
      />,
    );

    await user.click(screen.getByText('Sessão X'));
    await user.click(screen.getByLabelText('Excluir sessão'));
    expect(screen.queryByText('Sessão X')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(screen.getByText('Sessão X')).toBeInTheDocument();
    expect(onDeleteSession).not.toHaveBeenCalled();
  });

  it('separates sessions by type into tabs with counts', async () => {
    const user = userEvent.setup();
    renderModule(
      <SessionsModule
        sessions={[
          makeSession({ id: 's1', title: 'Sessão 06 de Gemini' }),
          makeSession({ id: 's2', title: 'Masterclass #3', type: 'Masterclass' }),
          makeSession({ id: 's3', title: 'Conversa com Googler', type: 'Conversa' }),
          makeSession({ id: 's4', title: 'Masterclass #2', type: 'Masterclass' }),
        ]}
        onSaveSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );
    expect(screen.getByRole('tab', { name: /Sessões/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Masterclasses/ })).toHaveTextContent('2');
    expect(screen.getByText('Sessão 06 de Gemini')).toBeInTheDocument();
    expect(screen.queryByText('Masterclass #3')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Masterclasses/ }));
    expect(screen.getByText('Masterclass #3')).toBeInTheDocument();
    expect(screen.getByText('Masterclass #2')).toBeInTheDocument();
    expect(screen.queryByText('Conversa com Googler')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nova Masterclass')).toBeInTheDocument();
  });

  it('creates a session with the type of the open tab', async () => {
    const user = userEvent.setup();
    const onSaveSession = vi.fn().mockResolvedValue(undefined);
    renderModule(<SessionsModule sessions={[]} onSaveSession={onSaveSession} onDeleteSession={vi.fn()} />);
    await user.click(screen.getByRole('tab', { name: /Conversas/ }));
    await user.click(screen.getByLabelText('Nova Conversa'));
    expect(screen.getByRole('heading', { name: 'Nova Conversa' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Conversa' })).toHaveAttribute('aria-checked', 'true');

    await user.type(document.getElementById('session-form-title') as HTMLInputElement, 'Conversa com Googler');
    await user.click(document.getElementById('session-form-date') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '15' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSaveSession).toHaveBeenCalledTimes(1));
    expect((onSaveSession.mock.calls[0]![0] as AmbassadorSession).type).toBe('Conversa');
  });

  it('groups records by month, newest first, and can sort by score without groups', async () => {
    const user = userEvent.setup();
    renderModule(
      <SessionsModule
        sessions={[
          makeSession({ id: 'a', title: 'Outubro A', date: '2026-10-05', score: 50 }),
          makeSession({ id: 'b', title: 'Novembro B', date: '2026-11-10', score: 5 }),
        ]}
        onSaveSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );
    const monthHeadings = () =>
      screen
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent ?? '')
        .filter((t) => / de 2026/.test(t));
    expect(monthHeadings()[0]).toMatch(/^Novembro de 2026/);
    expect(monthHeadings()[1]).toMatch(/^Outubro de 2026/);

    await user.click(screen.getByRole('button', { name: /Ordenar registros/ }));
    await user.click(screen.getByRole('option', { name: 'Maior pontuação' }));
    expect(monthHeadings()).toHaveLength(0);
    expect(screen.getAllByRole('article')[0]).toHaveTextContent('Outubro A');
  });

  it('filters by a tool when its chip is clicked, and by records without proof', async () => {
    const user = userEvent.setup();
    renderModule(
      <SessionsModule
        sessions={[
          makeSession({ id: 's1', title: 'Com foto', toolLearned: 'Gemini', proofImage: 'https://x/p.png' }),
          makeSession({ id: 's2', title: 'Sem foto', toolLearned: 'Canva' }),
        ]}
        onSaveSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Gemini' }));
    expect(screen.queryByText('Sem foto')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Remover filtro de ferramenta Gemini'));
    expect(screen.getByText('Sem foto')).toBeInTheDocument();

    const filters = screen.getByRole('group', { name: 'Filtrar registros' });
    await user.click(within(filters).getByRole('button', { name: /Sem comprovação/ }));
    expect(screen.queryByText('Com foto')).not.toBeInTheDocument();
    expect(screen.getByText('Sem foto')).toBeInTheDocument();
  });

  it('uses the record type in detail actions and navigates with the arrow keys', async () => {
    const user = userEvent.setup();
    renderModule(
      <SessionsModule
        sessions={[
          makeSession({ id: 'm1', title: 'Masterclass nova', type: 'Masterclass', date: '2026-11-02' }),
          makeSession({
            id: 'm2',
            title: 'Masterclass antiga',
            type: 'Masterclass',
            date: '2026-10-02',
            notes: '**Ideia** chave',
          }),
        ]}
        onSaveSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
      { route: '/?tipo=Masterclass' },
    );
    await user.click(screen.getByText('Masterclass nova'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Excluir masterclass')).toBeInTheDocument();
    expect(within(dialog).getByText('1 de 2')).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('dialog', { name: 'Masterclass antiga' })).toBeInTheDocument();
    expect(screen.getByText('Ideia').tagName).toBe('STRONG');
  });

  it('duplicates a record into a new form dated today, without its proof', async () => {
    const user = userEvent.setup();
    const onSaveSession = vi.fn().mockResolvedValue(undefined);
    renderModule(
      <SessionsModule
        sessions={[
          makeSession({ id: 'orig', title: 'Conversa semanal', toolLearned: 'Gemini', proofImage: 'https://x/p.png' }),
        ]}
        onSaveSession={onSaveSession}
        onDeleteSession={vi.fn()}
      />,
    );
    await user.click(screen.getByLabelText('Ações de Conversa semanal'));
    await user.click(screen.getByRole('menuitem', { name: 'Duplicar' }));
    expect(screen.getByRole('heading', { name: 'Nova Sessão' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSaveSession).toHaveBeenCalledTimes(1));
    const saved = onSaveSession.mock.calls[0]![0] as AmbassadorSession;
    expect(saved.id).not.toBe('orig');
    expect(saved.title).toBe('Conversa semanal');
    expect(saved.toolLearned).toBe('Gemini');
    expect(saved.proofImage).toBeUndefined();
    expect(saved.date).toBe(todayISO());
  });

  it('keeps an unsaved draft when the form is closed and restores it on "Nova Sessão"', async () => {
    const user = userEvent.setup();
    renderModule(<SessionsModule sessions={[]} onSaveSession={vi.fn()} onDeleteSession={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova Sessão'));
    await user.type(document.getElementById('session-form-title') as HTMLInputElement, 'Rascunho importante');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText(/Rascunho guardado/)).toBeInTheDocument();
    await user.click(screen.getAllByLabelText('Nova Sessão')[0]!);
    expect(document.getElementById('session-form-title')).toHaveValue('Rascunho importante');
  });

  it('adds tools as chips and leaves the score empty unless filled', async () => {
    const user = userEvent.setup();
    const onSaveSession = vi.fn().mockResolvedValue(undefined);
    renderModule(
      <SessionsModule
        sessions={[makeSession({ id: 'old', toolLearned: 'NotebookLM' })]}
        onSaveSession={onSaveSession}
        onDeleteSession={vi.fn()}
      />,
    );
    await user.click(screen.getByLabelText('Nova Sessão'));
    expect(document.getElementById('session-form-score')).toHaveValue('');

    await user.type(document.getElementById('session-form-title') as HTMLInputElement, 'Nova');
    await user.type(document.getElementById('session-form-tool') as HTMLInputElement, 'Gemini{Enter}notebooklm{Enter}');
    expect(screen.getByLabelText('Remover Gemini')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSaveSession).toHaveBeenCalledTimes(1));
    const saved = onSaveSession.mock.calls[0]![0] as AmbassadorSession;
    expect(saved.toolLearned).toBe('Gemini, NotebookLM');
    expect(saved.score).toBeUndefined();
  });

  it('reports every oversized attachment, not only the last one', async () => {
    const user = userEvent.setup();
    renderModule(<SessionsModule sessions={[]} onSaveSession={vi.fn()} onDeleteSession={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova Sessão'));
    const big = (name: string) => new File([new Uint8Array(9 * 1024 * 1024)], name, { type: 'application/pdf' });
    const [challengeFileInput] = document.querySelectorAll('input[type="file"]');
    await user.upload(challengeFileInput as HTMLInputElement, [big('a.pdf'), big('b.pdf')]);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('2 arquivos');
    expect(alert).toHaveTextContent('"a.pdf"');
    expect(alert).toHaveTextContent('"b.pdf"');
  });

  it('links an existing record to an Acervo meeting from the edit form', async () => {
    const user = userEvent.setup();
    const onSaveSession = vi.fn().mockResolvedValue(undefined);
    renderModule(
      <SessionsModule
        sessions={[makeSession({ id: 'old', title: 'Gemini Live' })]}
        onSaveSession={onSaveSession}
        onDeleteSession={vi.fn()}
      />,
    );
    await user.click(screen.getByLabelText('Ações de Gemini Live'));
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
    await user.click(screen.getByRole('button', { name: /Vincular a um encontro do Acervo/ }));
    await user.click(screen.getByRole('option', { name: /Sessão 04 de Google Gemini: Gemini Live/ }));
    expect(screen.getByText(/Encontro oficial do Acervo/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(onSaveSession).toHaveBeenCalledTimes(1));
    expect((onSaveSession.mock.calls[0]![0] as AmbassadorSession).pastSessionId).toBe('gemini-04-gemini-live');
  });

  it('opens a form prefilled from an Acervo meeting via ?registrar=', async () => {
    const user = userEvent.setup();
    const onSaveSession = vi.fn().mockResolvedValue(undefined);
    renderModule(<SessionsModule sessions={[]} onSaveSession={onSaveSession} onDeleteSession={vi.fn()} />, {
      route: '/?tipo=Masterclass&registrar=masterclass-creator-02',
    });
    expect(await screen.findByRole('heading', { name: 'Nova Masterclass' })).toBeInTheDocument();
    expect(document.getElementById('session-form-title')).toHaveValue('Masterclass com Creator #2: Leo Candido');
    expect(screen.getByText(/Encontro oficial do Acervo/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(onSaveSession).toHaveBeenCalledTimes(1));
    const saved = onSaveSession.mock.calls[0]![0] as AmbassadorSession;
    expect(saved).toMatchObject({ type: 'Masterclass', date: '2026-10-16', pastSessionId: 'masterclass-creator-02' });
  });
});
