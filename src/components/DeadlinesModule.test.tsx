import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DeadlinesModule } from './DeadlinesModule';
import { ProgramDeadline } from '../types';
import { makeProgramDeadline } from '../test/factories';

describe('DeadlinesModule', () => {
  it('shows an empty state when there are no deadlines', () => {
    render(<DeadlinesModule deadlines={[]} onSaveDeadline={vi.fn()} onDeleteDeadline={vi.fn()} />);
    expect(screen.getByText('Nenhum prazo registrado')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows an overall progress bar reflecting completed deadlines', () => {
    render(
      <DeadlinesModule
        deadlines={[
          makeProgramDeadline({ id: 'd1', isCompleted: true }),
          makeProgramDeadline({ id: 'd2', isCompleted: false }),
          makeProgramDeadline({ id: 'd3', isCompleted: false }),
          makeProgramDeadline({ id: 'd4', isCompleted: false }),
        ]}
        onSaveDeadline={vi.fn()}
        onDeleteDeadline={vi.fn()}
      />
    );
    expect(screen.getByText('1 de 4 prazos cumpridos')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '25');
  });

  it('lists deadlines sorted from the soonest first', () => {
    render(
      <DeadlinesModule
        deadlines={[
          makeProgramDeadline({ id: 'd1', title: 'Prazo distante', date: '2026-12-01' }),
          makeProgramDeadline({ id: 'd2', title: 'Prazo próximo', date: '2026-09-15' }),
        ]}
        onSaveDeadline={vi.fn()}
        onDeleteDeadline={vi.fn()}
      />
    );
    const titles = screen.getAllByText(/^Prazo (próximo|distante)$/);
    expect(titles[0]).toHaveTextContent('Prazo próximo');
    expect(titles[1]).toHaveTextContent('Prazo distante');
  });

  it('flags a pending deadline in the past as overdue', () => {
    render(
      <DeadlinesModule
        deadlines={[makeProgramDeadline({ id: 'd1', date: '2020-01-01', isCompleted: false })]}
        onSaveDeadline={vi.fn()}
        onDeleteDeadline={vi.fn()}
      />
    );
    expect(screen.getByText('Atrasado')).toBeInTheDocument();
  });

  it('does not flag a completed deadline as overdue even if its date has passed', () => {
    render(
      <DeadlinesModule
        deadlines={[makeProgramDeadline({ id: 'd1', date: '2020-01-01', isCompleted: true })]}
        onSaveDeadline={vi.fn()}
        onDeleteDeadline={vi.fn()}
      />
    );
    expect(screen.queryByText('Atrasado')).not.toBeInTheDocument();
  });

  it('keeps the submit button disabled until title and date are filled', async () => {
    const user = userEvent.setup();
    render(<DeadlinesModule deadlines={[]} onSaveDeadline={vi.fn()} onDeleteDeadline={vi.fn()} />);
    await user.click(screen.getByLabelText('Novo prazo'));

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    const titleInput = within(screen.getByRole('dialog')).getAllByRole('textbox')[0];
    await user.type(titleInput, 'Entrega do desafio');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await user.click(document.getElementById('deadline-form-date') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '15' }));
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });

  it('creates a deadline with the selected date and category', async () => {
    const user = userEvent.setup();
    const onSaveDeadline = vi.fn().mockResolvedValue(undefined);
    render(<DeadlinesModule deadlines={[]} onSaveDeadline={onSaveDeadline} onDeleteDeadline={vi.fn()} />);
    await user.click(screen.getByLabelText('Novo prazo'));

    const titleInput = within(screen.getByRole('dialog')).getAllByRole('textbox')[0];
    await user.type(titleInput, '  Entrega do desafio  ');
    await user.click(document.getElementById('deadline-form-date') as HTMLButtonElement);
    await user.click(screen.getByRole('button', { name: '15' }));
    await user.click(screen.getByLabelText('Categoria'));
    await user.click(screen.getByRole('option', { name: 'Post' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSaveDeadline).toHaveBeenCalledTimes(1));
    const saved = onSaveDeadline.mock.calls[0][0] as ProgramDeadline;
    expect(saved.title).toBe('Entrega do desafio');
    expect(saved.category).toBe('Post');
    expect(saved.date).toMatch(/^\d{4}-\d{2}-15$/);
  });

  it('toggles completion when the status button is clicked', async () => {
    const user = userEvent.setup();
    const onSaveDeadline = vi.fn().mockResolvedValue(undefined);
    render(
      <DeadlinesModule
        deadlines={[makeProgramDeadline({ id: 'd1', isCompleted: false })]}
        onSaveDeadline={onSaveDeadline}
        onDeleteDeadline={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText('Marcar como concluído'));

    await waitFor(() => expect(onSaveDeadline).toHaveBeenCalledTimes(1));
    expect(onSaveDeadline.mock.calls[0][0].isCompleted).toBe(true);
  });

  it('asks for confirmation before deleting a deadline', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDeleteDeadline = vi.fn();
    render(
      <DeadlinesModule
        deadlines={[makeProgramDeadline({ id: 'd1' })]}
        onSaveDeadline={vi.fn()}
        onDeleteDeadline={onDeleteDeadline}
      />
    );

    await user.click(screen.getByLabelText('Excluir prazo'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteDeadline).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
