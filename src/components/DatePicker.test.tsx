import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  it('shows a placeholder when no date is selected', () => {
    render(<DatePicker value="" onChange={vi.fn()} />);
    expect(screen.getByText('Selecionar data')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the formatted date when a value is provided', () => {
    render(<DatePicker value="2026-03-10" onChange={vi.fn()} />);
    expect(screen.getByText('10/03/2026')).toBeInTheDocument();
  });

  it('opens the calendar on the selected month and picks a day', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker value="2026-03-10" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '10/03/2026' }));
    expect(screen.getByRole('dialog', { name: 'Selecionar data' })).toBeInTheDocument();
    expect(screen.getByText('Março 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '20' }));
    expect(onChange).toHaveBeenCalledWith('2026-03-20');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navigates to the next and previous month', async () => {
    const user = userEvent.setup();
    render(<DatePicker value="2026-03-10" onChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '10/03/2026' }));

    expect(screen.getByText('Março 2026')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(screen.getByText('Abril 2026')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mês anterior' }));
    await user.click(screen.getByRole('button', { name: 'Mês anterior' }));
    expect(screen.getByText('Fevereiro 2026')).toBeInTheDocument();
  });

  it('closes the calendar when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DatePicker value="2026-03-10" onChange={vi.fn()} />
        <button>Fora</button>
      </div>
    );
    await user.click(screen.getByRole('button', { name: '10/03/2026' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fora' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
