import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WeeklyScoreModule } from './WeeklyScoreModule';
import { WeeklyScore } from '../types';
import { makeWeeklyScore } from '../test/factories';

describe('WeeklyScoreModule', () => {
  it('shows an empty state when there are no weekly scores', () => {
    render(<WeeklyScoreModule weeklyScores={[]} onSaveWeeklyScore={vi.fn()} onDeleteWeeklyScore={vi.fn()} />);
    expect(screen.getByText('Nenhuma pontuação registrada')).toBeInTheDocument();
  });

  it('lists weeks sorted from the most recent first', () => {
    render(
      <WeeklyScoreModule
        weeklyScores={[
          makeWeeklyScore({ id: 'w1', weekStart: '2026-08-24', weekEnd: '2026-08-31', points: 145 }),
          makeWeeklyScore({ id: 'w2', weekStart: '2026-09-01', weekEnd: '2026-09-07', points: 55 }),
        ]}
        onSaveWeeklyScore={vi.fn()}
        onDeleteWeeklyScore={vi.fn()}
      />
    );
    const rows = screen.getAllByText(/^\d{2}\/\d{2} a \d{2}\/\d{2}$/);
    expect(rows[0]).toHaveTextContent('01/09 a 07/09');
    expect(rows[1]).toHaveTextContent('24/08 a 31/08');
  });

  it('keeps the submit button disabled until both dates and points are filled', async () => {
    const user = userEvent.setup();
    render(<WeeklyScoreModule weeklyScores={[]} onSaveWeeklyScore={vi.fn()} onDeleteWeeklyScore={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova pontuação semanal'));

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await user.click(document.getElementById('weekly-score-form-start') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '10' }));
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await user.click(document.getElementById('weekly-score-form-end') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '20' }));
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Ex: 145'), '80');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });

  it('creates a weekly score with the selected dates and points', async () => {
    const user = userEvent.setup();
    const onSaveWeeklyScore = vi.fn().mockResolvedValue(undefined);
    render(<WeeklyScoreModule weeklyScores={[]} onSaveWeeklyScore={onSaveWeeklyScore} onDeleteWeeklyScore={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova pontuação semanal'));

    await user.click(document.getElementById('weekly-score-form-start') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '10' }));
    await user.click(document.getElementById('weekly-score-form-end') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '20' }));
    await user.type(screen.getByPlaceholderText('Ex: 145'), '80');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSaveWeeklyScore).toHaveBeenCalledTimes(1));
    const saved = onSaveWeeklyScore.mock.calls[0][0] as WeeklyScore;
    expect(saved.points).toBe(80);
    expect(saved.weekStart).toMatch(/^\d{4}-\d{2}-10$/);
    expect(saved.weekEnd).toMatch(/^\d{4}-\d{2}-20$/);
  });

  it('rejects an end date earlier than the start date', async () => {
    const user = userEvent.setup();
    const onSaveWeeklyScore = vi.fn();
    render(<WeeklyScoreModule weeklyScores={[]} onSaveWeeklyScore={onSaveWeeklyScore} onDeleteWeeklyScore={vi.fn()} />);
    await user.click(screen.getByLabelText('Nova pontuação semanal'));

    await user.click(document.getElementById('weekly-score-form-start') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '20' }));
    await user.click(document.getElementById('weekly-score-form-end') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '10' }));
    await user.type(screen.getByPlaceholderText('Ex: 145'), '80');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/não pode ser antes/);
    expect(onSaveWeeklyScore).not.toHaveBeenCalled();
  });

  it('opens the edit form pre-filled when a week is edited', async () => {
    const user = userEvent.setup();
    render(
      <WeeklyScoreModule
        weeklyScores={[makeWeeklyScore({ id: 'w1', points: 145 })]}
        onSaveWeeklyScore={vi.fn()}
        onDeleteWeeklyScore={vi.fn()}
      />
    );
    await user.click(screen.getByLabelText('Editar pontuação'));
    expect(within(screen.getByRole('dialog')).getByText('Editar Pontuação')).toBeInTheDocument();
    expect(screen.getByDisplayValue('145')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting a weekly score', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDeleteWeeklyScore = vi.fn();
    render(
      <WeeklyScoreModule
        weeklyScores={[makeWeeklyScore({ id: 'w1' })]}
        onSaveWeeklyScore={vi.fn()}
        onDeleteWeeklyScore={onDeleteWeeklyScore}
      />
    );

    await user.click(screen.getByLabelText('Excluir pontuação'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteWeeklyScore).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
