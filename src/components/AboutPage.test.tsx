import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutPage } from './AboutPage';

describe('AboutPage', () => {
  it('renders the program overview, sections and a link back home', () => {
    render(<AboutPage />);
    expect(screen.getByText('Sobre o Programa')).toBeInTheDocument();
    expect(screen.getByText('Como Funciona o Programa')).toBeInTheDocument();
    expect(screen.getByText('Benefícios para os Selecionados')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Voltar|Hub GSA 2026/ })[0]).toHaveAttribute('href', '/');
  });
});
