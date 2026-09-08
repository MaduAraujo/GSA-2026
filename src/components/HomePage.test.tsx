import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';

function renderHomePage(overrides: Partial<React.ComponentProps<typeof HomePage>> = {}) {
  const props = {
    onLogin: vi.fn(),
    isDarkMode: false,
    onToggleDarkMode: vi.fn(),
    deferredPrompt: null,
    onInstallPwa: vi.fn(),
    isPwaModalOpen: false,
    onClosePwaModal: vi.fn(),
    ...overrides,
  };
  render(<HomePage {...props} />);
  return props;
}

describe('HomePage', () => {
  it('renders the hero headline, highlights and feature modules', () => {
    renderHomePage();
    expect(screen.getByText(/organizada em um só lugar/)).toBeInTheDocument();
    expect(screen.getByText('Instalável como app')).toBeInTheDocument();
    expect(screen.getByText('Cofre de Prompts')).toBeInTheDocument();
  });

  it('calls onLogin when the Entrar button is clicked', async () => {
    const user = userEvent.setup();
    const { onLogin } = renderHomePage();
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleDarkMode when the theme button is clicked', async () => {
    const user = userEvent.setup();
    const { onToggleDarkMode } = renderHomePage();
    await user.click(screen.getByLabelText('Alternar tema'));
    expect(onToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  it('calls onInstallPwa when the desktop nav Instalar button is clicked', async () => {
    const user = userEvent.setup();
    const { onInstallPwa } = renderHomePage();
    await user.click(screen.getByRole('button', { name: 'Instalar' }));
    expect(onInstallPwa).toHaveBeenCalledTimes(1);
  });

  it('opens the mobile menu and closes it after choosing Instalar', async () => {
    const user = userEvent.setup();
    const onInstallPwa = vi.fn();
    renderHomePage({ onInstallPwa });
    const menuButton = screen.getByLabelText('Abrir menu');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    const mobileInstallButtons = screen.getAllByRole('button', { name: 'Instalar' });
    await user.click(mobileInstallButtons[mobileInstallButtons.length - 1]);

    expect(onInstallPwa).toHaveBeenCalledTimes(1);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the PWA guide modal when isPwaModalOpen is true', () => {
    renderHomePage({ isPwaModalOpen: true });
    expect(screen.getByText('Instalar Aplicativo (PWA)')).toBeInTheDocument();
  });
});
