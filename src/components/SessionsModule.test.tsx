import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionsModule } from './SessionsModule';
import { type AmbassadorSession } from '../types';
import { makeSession } from '../test/factories';

describe('SessionsModule', () => {
  beforeEach(() => sessionStorage.clear());

  it('shows an empty state when there are no sessions', () => {
    render(<SessionsModule sessions={[]} onSaveSession={vi.fn()} onDeleteSession={vi.fn()} />);
    expect(screen.getByText('Nenhum item em Sessões')).toBeInTheDocument();
  });

  it('filters sessions by title, challenge or tool learned', async () => {
    const user = userEvent.setup();
    render(
      <SessionsModule
        sessions={[
          makeSession({ id: 's1', title: 'Mentoria Gemini', toolLearned: 'Gemini' }),
          makeSession({ id: 's2', title: 'Encontro local', toolLearned: 'Canva' }),
        ]}
        onSaveSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText('Buscar por título, desafio ou ferramenta...'), 'gemini');
    expect(screen.getByText('Mentoria Gemini')).toBeInTheDocument();
    expect(screen.queryByText('Encontro local')).not.toBeInTheDocument();
  });

  it('keeps the submit button disabled until title and date are filled', async () => {
    const user = userEvent.setup();
    render(<SessionsModule sessions={[]} onSaveSession={vi.fn()} onDeleteSession={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova Sessão'));

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    const titleInput = within(screen.getByRole('dialog')).getAllByRole('textbox')[0]!;
    await user.type(titleInput, 'Sessão de mentoria');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await user.click(document.getElementById('session-form-date') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '15' }));
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });

  it('creates a session with the selected date and trimmed title', async () => {
    const user = userEvent.setup();
    const onSaveSession = vi.fn().mockResolvedValue(undefined);
    render(<SessionsModule sessions={[]} onSaveSession={onSaveSession} onDeleteSession={vi.fn()} />);
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
    render(<SessionsModule sessions={[]} onSaveSession={vi.fn()} onDeleteSession={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova Sessão'));

    const bigFile = new File([new Uint8Array(9 * 1024 * 1024)], 'grande.pdf', { type: 'application/pdf' });
    const [challengeFileInput] = document.querySelectorAll('input[type="file"]');
    await user.upload(challengeFileInput as HTMLInputElement, bigFile);

    expect(await screen.findByRole('alert')).toHaveTextContent(/muito grande/);
  });

  it('asks for confirmation before deleting a session', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDeleteSession = vi.fn();
    render(
      <SessionsModule
        sessions={[makeSession({ title: 'Sessão X' })]}
        onSaveSession={vi.fn()}
        onDeleteSession={onDeleteSession}
      />,
    );

    await user.click(screen.getByText('Sessão X'));
    await user.click(screen.getByLabelText('Excluir sessão'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteSession).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('separates sessions by type into tabs with counts', async () => {
    const user = userEvent.setup();
    render(
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
    render(<SessionsModule sessions={[]} onSaveSession={onSaveSession} onDeleteSession={vi.fn()} />);
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
});
