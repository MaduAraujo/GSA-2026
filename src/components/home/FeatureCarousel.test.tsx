import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Award, Camera, Flag } from 'lucide-react';
import { FeatureCarousel, type FeatureItem } from './FeatureCarousel';

const ITEMS: FeatureItem[] = [
  { icon: Award, title: 'Certificados', description: 'a', accent: '#1a73e8' },
  { icon: Flag, title: 'Desafios', description: 'b', accent: '#fbbc04' },
  { icon: Camera, title: 'Galeria', description: 'c', accent: '#34a853' },
];

const current = () =>
  screen.getAllByRole('button', { name: /^Ir para / }).find((b) => b.getAttribute('aria-current') === 'true');

describe('FeatureCarousel', () => {
  it('renders every item', () => {
    render(<FeatureCarousel items={ITEMS} />);
    for (const { title } of ITEMS) expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('navigates with next/previous buttons and wraps around', async () => {
    const user = userEvent.setup();
    render(<FeatureCarousel items={ITEMS} />);
    expect(current()).toHaveAccessibleName('Ir para Certificados');
    await user.click(screen.getByRole('button', { name: 'Próximo módulo' }));
    expect(current()).toHaveAccessibleName('Ir para Desafios');
    await user.click(screen.getByRole('button', { name: 'Módulo anterior' }));
    await user.click(screen.getByRole('button', { name: 'Módulo anterior' }));
    expect(current()).toHaveAccessibleName('Ir para Galeria');
  });

  it('jumps to an item from its dot', async () => {
    const user = userEvent.setup();
    render(<FeatureCarousel items={ITEMS} />);
    await user.click(screen.getByRole('button', { name: 'Ir para Galeria' }));
    expect(current()).toHaveAccessibleName('Ir para Galeria');
  });
});
