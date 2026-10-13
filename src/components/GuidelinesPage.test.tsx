import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GuidelinesPage } from './GuidelinesPage';

describe('GuidelinesPage', () => {
  it('shows the community guidelines with every section', () => {
    render(<GuidelinesPage />);
    expect(screen.getByRole('heading', { level: 1, name: /Combinados que fazem a diferença/i })).toBeInTheDocument();
    for (const title of [
      'Respeito vem primeiro',
      'Privacidade',
      'Compartilhe com responsabilidade',
      'Participação também faz parte do combinado',
      'O que pode levar ao desligamento?',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
    expect(screen.getByText('Ofensas e ataques:')).toBeInTheDocument();
    expect(screen.getByText(/persista por 45 dias consecutivos/)).toBeInTheDocument();
  });
});
