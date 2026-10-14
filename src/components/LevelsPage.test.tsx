import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LevelsView } from './LevelsPage';
import { LEVEL_MIN_POINTS, levelProgress } from './levels';

describe('LevelsView', () => {
  it('lists the three levels in order with their descriptions', () => {
    render(<LevelsView />);
    expect(screen.getByRole('heading', { name: 'SUBINDO DE NÍVEL' })).toBeInTheDocument();
    expect(screen.getByText(/novos níveis são desbloqueados/)).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Nível 1');
    expect(items[0]).toHaveTextContent('Explorador(a)');
    expect(items[0]).toHaveTextContent(/descobrindo novas possibilidades com o Google Gemini/);
    expect(items[1]).toHaveTextContent('Expert de Comunidade');
    expect(items[2]).toHaveTextContent('Catalisador(a)');
    expect(items[2]).toHaveTextContent(/espaços da universidade/);
  });

  it('hides the progress card while points are loading', () => {
    render(<LevelsView />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('Seu nível')).not.toBeInTheDocument();
  });

  it('shows the points left, current level and next milestone', () => {
    const points = LEVEL_MIN_POINTS[1] + 130;
    const left = LEVEL_MIN_POINTS[2] - points;
    render(<LevelsView points={points} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      `VOCÊ ESTÁ A ${left} PONTOS PARA DESBLOQUEAR O PRÓXIMO NÍVEL NO PROGRAMA`,
    );
    expect(screen.getByText('Nível atual').nextSibling).toHaveTextContent('Expert de Comunidade');
    expect(screen.getByText('Próximo marco!').nextSibling).toHaveTextContent('Catalisador(a)');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(levelProgress(points).percent));
    expect(screen.getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step');
  });

  it('celebrates the top level with a full bar', () => {
    render(<LevelsView points={LEVEL_MIN_POINTS[2] + 50} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('VOCÊ ALCANÇOU O NÍVEL MÁXIMO DO PROGRAMA!');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getAllByRole('listitem')[2]).toHaveAttribute('aria-current', 'step');
  });
});

describe('levelProgress', () => {
  it('starts at the first level with zero progress', () => {
    expect(levelProgress(0)).toMatchObject({ percent: 0, pointsToNext: LEVEL_MIN_POINTS[1] });
    expect(levelProgress(0).current.title).toBe('Explorador(a)');
    expect(levelProgress(-10).current.title).toBe('Explorador(a)');
  });

  it('moves up exactly at each threshold', () => {
    expect(levelProgress(LEVEL_MIN_POINTS[1] - 1).current.level).toBe(1);
    expect(levelProgress(LEVEL_MIN_POINTS[1]).current.level).toBe(2);
    expect(levelProgress(LEVEL_MIN_POINTS[1]).percent).toBe(0);
    expect(levelProgress(LEVEL_MIN_POINTS[2]).current.level).toBe(3);
    expect(levelProgress(LEVEL_MIN_POINTS[2]).next).toBeNull();
  });
});
