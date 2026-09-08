import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionsModule } from './SessionsModule';
import { AmbassadorSession } from '../types';
import { makeSession } from '../test/factories';

describe('SessionsModule', () => {
  it('shows an empty state when there are no sessions', () => {
    render(<SessionsModule sessions={[]} onSaveSession={vi.fn()} onDeleteSession={vi.fn()} />);
    expect(screen.getByText('Nenhuma sessão encontrada')).toBeInTheDocument();
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
      />
    );
    await user.type(screen.getByPlaceholderText('Buscar por sessão, desafio ou ferramenta...'), 'gemini');
    expect(screen.getByText('Mentoria Gemini')).toBeInTheDocument();
    expect(screen.queryByText('Encontro local')).not.toBeInTheDocument();
  });

  it('keeps the submit button disabled until title and date are filled', async () => {
    const user = userEvent.setup();
    render(<SessionsModule sessions={[]} onSaveSession={vi.fn()} onDeleteSession={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova sessão'));

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    const titleInput = within(screen.getByRole('dialog')).getAllByRole('textbox')[0];
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
    await user.click(screen.getByLabelText('Nova sessão'));

    const titleInput = within(screen.getByRole('dialog')).getAllByRole('textbox')[0];
    await user.type(titleInput, '  Sessão com o time  ');
    await user.click(document.getElementById('session-form-date') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '15' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSaveSession).toHaveBeenCalledTimes(1));
    const saved = onSaveSession.mock.calls[0][0] as AmbassadorSession;
    expect(saved.title).toBe('Sessão com o time');
    expect(saved.date).toMatch(/^\d{4}-\d{2}-15$/);
  });

  it('rejects a challenge attachment larger than 8MB', async () => {
    const user = userEvent.setup();
    render(<SessionsModule sessions={[]} onSaveSession={vi.fn()} onDeleteSession={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova sessão'));

    const bigFile = new File([new Uint8Array(9 * 1024 * 1024)], 'grande.pdf', { type: 'application/pdf' });
    const [challengeFileInput] = document.querySelectorAll('input[type="file"]');
    await user.upload(challengeFileInput as HTMLInputElement, bigFile);

    expect(await screen.findByRole('alert')).toHaveTextContent(/muito grande/);
  });

  it('asks for confirmation before deleting a session', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDeleteSession = vi.fn();
    render(<SessionsModule sessions={[makeSession({ title: 'Sessão X' })]} onSaveSession={vi.fn()} onDeleteSession={onDeleteSession} />);

    await user.click(screen.getByText('Sessão X'));
    await user.click(screen.getByLabelText('Excluir sessão'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteSession).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
