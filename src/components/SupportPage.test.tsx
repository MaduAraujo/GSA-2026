import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SupportPage } from './SupportPage';

describe('SupportPage', () => {
  it('shows the support message and a button to the Google Forms support form', () => {
    render(<SupportPage />);
    expect(screen.getByRole('heading', { name: 'PRECISA DE AJUDA?' })).toBeInTheDocument();
    expect(screen.getByText('Fale com o time do Amplifica!')).toBeInTheDocument();
    expect(screen.getByText(/parceria para transformar ideias em impacto real/)).toBeInTheDocument();

    const button = screen.getByRole('link', { name: 'Suporte aqui' });
    expect(button).toHaveAttribute(
      'href',
      'https://docs.google.com/forms/d/e/1FAIpQLSc3vcViCoOve7lPoFDnglUvktSU9Q5GGjQLr1G4pJAjb7JhKw/viewform',
    );
    expect(button).toHaveAttribute('target', '_blank');
    expect(button).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
