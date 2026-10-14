import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Navbar } from './Navbar';
import { makeProfile } from '../test/factories';
import { renderWithProviders } from '../test/render';

function renderNavbar(overrides: Partial<React.ComponentProps<typeof Navbar>> = {}) {
  const props = {
    isMobileNavOpen: false,
    onToggleMobileNav: vi.fn(),
    profile: makeProfile({ name: 'Ana Souza', email: 'ana@example.com' }),
    onOpenProfile: vi.fn(),
    onOpenAmbassadorArea: vi.fn(),
    onOpenSettings: vi.fn(),
    onSignOut: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<Navbar {...props} />);
  return props;
}

describe('Navbar', () => {
  it('links the trophy next to the profile photo to the levels page', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: 'Níveis' })).toHaveAttribute('href', '/niveis');
  });

  it('toggles the mobile sidebar from the menu button', async () => {
    const user = userEvent.setup();
    const { onToggleMobileNav } = renderNavbar();
    const button = screen.getByRole('button', { name: 'Abrir menu' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(onToggleMobileNav).toHaveBeenCalledTimes(1);
  });

  it('opens the account menu and shows the profile name and email', async () => {
    const user = userEvent.setup();
    renderNavbar();
    expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Abrir menu da conta'));
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });

  it('shows a "Site Oficial" link pointing to the external program site', async () => {
    const user = userEvent.setup();
    renderNavbar();
    await user.click(screen.getByLabelText('Abrir menu da conta'));
    const link = screen.getByRole('link', { name: 'Site Oficial' });
    expect(link).toHaveAttribute('href', 'https://amplifica.me/siteembaixadoresestudantis');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('calls onOpenSettings when Configurações is clicked', async () => {
    const user = userEvent.setup();
    const { onOpenSettings } = renderNavbar();
    await user.click(screen.getByLabelText('Abrir menu da conta'));
    await user.click(screen.getByText('Configurações'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('calls onSignOut when Sair da conta is clicked', async () => {
    const user = userEvent.setup();
    const { onSignOut } = renderNavbar();
    await user.click(screen.getByLabelText('Abrir menu da conta'));
    await user.click(screen.getByText('Sair da conta'));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('gains a shadow when the desktop content area (#app-scroll) scrolls', () => {
    renderNavbar();
    const scroller = document.createElement('div');
    scroller.id = 'app-scroll';
    document.body.appendChild(scroller);
    const header = screen.getByRole('banner');
    expect(header).not.toHaveClass('shadow-sm');

    scroller.scrollTop = 50;
    fireEvent.scroll(scroller);
    expect(header).toHaveClass('shadow-sm');
    scroller.remove();
  });
});
