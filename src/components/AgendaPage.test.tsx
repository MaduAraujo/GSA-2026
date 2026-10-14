import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgendaPage } from './AgendaPage';
import { currentAgendaWeek } from './agendaWeeks';

describe('AgendaPage', () => {
  afterEach(() => vi.useRealTimers());

  it('shows the heading, intro and all nine weeks in order', () => {
    render(<AgendaPage />);
    expect(screen.getByRole('heading', { name: 'O QUE VEM POR AÍ' })).toBeInTheDocument();
    expect(screen.getByText(/novos encontros, novos conteúdos e novos momentos/)).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(9);
    expect(items[0]).toHaveTextContent('Semana 1');
    expect(items[0]).toHaveTextContent('24/08 a 30/08');
    expect(items[8]).toHaveTextContent('Semana 9');
    expect(items[8]).toHaveTextContent('19/10 a 25/10');
  });

  it('links the onboarding page in a new tab', () => {
    render(<AgendaPage />);
    const link = screen.getByRole('link', { name: /Onboarding/ });
    expect(link).toHaveAttribute(
      'href',
      'https://sites.google.com/amplifica.me/embaixadoresestudantis/agenda/onboarding',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('links weeks 1–8 to their Google Sites page in a new tab', () => {
    render(<AgendaPage />);
    const links = screen.getAllByRole('link', { name: /^Semana/ });
    expect(links).toHaveLength(8);
    expect(links[0]).toHaveAttribute(
      'href',
      'https://sites.google.com/amplifica.me/embaixadoresestudantis/agenda/semana1',
    );
    expect(links[7]).toHaveAttribute(
      'href',
      'https://sites.google.com/amplifica.me/embaixadoresestudantis/agenda/semana8',
    );
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.getAllByRole('listitem')[8]!.querySelector('a')).toBeNull();
  });

  it('highlights the current week', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 14, 12));
    render(<AgendaPage />);
    const current = screen.getByText('Esta semana').closest('li');
    expect(current).toHaveTextContent('Semana 8');
    expect(current).toHaveAttribute('aria-current', 'date');
  });

  it('matches week boundaries inclusively and returns null outside the program', () => {
    expect(currentAgendaWeek(new Date(2026, 7, 24, 0, 0))).toBe(1);
    expect(currentAgendaWeek(new Date(2026, 7, 30, 23, 0))).toBe(1);
    expect(currentAgendaWeek(new Date(2026, 9, 25, 23, 59))).toBe(9);
    expect(currentAgendaWeek(new Date(2026, 9, 26))).toBeNull();
    expect(currentAgendaWeek(new Date(2026, 7, 23))).toBeNull();
  });
});
