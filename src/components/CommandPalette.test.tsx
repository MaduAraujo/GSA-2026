import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { makeCertificate, makeChallenge } from '../test/factories';
import { CommandPalette } from './CommandPalette';

const COLLECTIONS: Record<string, unknown[]> = {
  certificates: [makeCertificate({ id: 'c1', title: 'Google Cloud Digital Leader' })],
  challenges: [makeChallenge({ id: 'h1', title: 'Ação no campus', type: 'Ação de Impacto' })],
};
const EMPTY: unknown[] = [];

vi.mock('../data/queries', () => ({
  useCollectionData: (name: string) => COLLECTIONS[name] ?? EMPTY,
}));

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

function renderPalette(overrides: Partial<React.ComponentProps<typeof CommandPalette>> = {}) {
  const props = {
    onClose: vi.fn(),
    onOpenProfile: vi.fn(),
    onOpenAmbassadorArea: vi.fn(),
    onOpenSettings: vi.fn(),
    onToggleDarkMode: vi.fn(),
    onSignOut: vi.fn(),
    ...overrides,
  };
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={['/certificados']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                {children}
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  }
  render(<CommandPalette {...props} />, { wrapper: Wrapper });
  return props;
}

describe('CommandPalette', () => {
  it('focuses the search box and lists every section to jump to', () => {
    renderPalette();
    expect(screen.getByRole('combobox', { name: /Buscar páginas/ })).toHaveFocus();
    expect(screen.getByRole('option', { name: /Prazos/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Suporte/ })).toBeInTheDocument();
  });

  it('matches without accents and opens the highlighted result with Enter', async () => {
    const user = userEvent.setup();
    const props = renderPalette();
    await user.type(screen.getByRole('combobox'), 'sessoes');
    expect(screen.getByRole('option', { name: /Sessões/ })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('location')).toHaveTextContent('/sessoes');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('opens one of your items on its tab with the search pre-filled', async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.type(screen.getByRole('combobox'), 'campus');
    await user.click(screen.getByRole('option', { name: /Ação no campus/ }));
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/desafios?q=A%C3%A7%C3%A3o+no+campus&tipo=A%C3%A7%C3%A3o+de+Impacto',
    );
  });

  it('runs account actions', async () => {
    const user = userEvent.setup();
    const props = renderPalette();
    await user.type(screen.getByRole('combobox'), 'modo escuro');
    await user.keyboard('{Enter}');
    expect(props.onToggleDarkMode).toHaveBeenCalledOnce();
  });

  it('moves the highlight with the arrow keys and wraps around', async () => {
    const user = userEvent.setup();
    renderPalette();
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown}');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');
  });

  it('says when nothing matches', async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.type(screen.getByRole('combobox'), 'zzzz');
    expect(screen.getByText(/Nada encontrado/)).toBeInTheDocument();
  });
});
