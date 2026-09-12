import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Navbar } from './Navbar';
import { makeProfile } from '../test/factories';

function renderNavbar(overrides: Partial<React.ComponentProps<typeof Navbar>> = {}) {
  const props = {
    activeTab: 'certificates' as const,
    setActiveTab: vi.fn(),
    profile: makeProfile({ name: 'Ana Souza', email: 'ana@example.com' }),
    onOpenProfile: vi.fn(),
    onOpenAmbassadorArea: vi.fn(),
    onOpenSettings: vi.fn(),
    onSignOut: vi.fn(),
    ...overrides,
  };
  render(<Navbar {...props} />);
  return props;
}

describe('Navbar', () => {
  it('marks the active tab with aria-current', () => {
    renderNavbar({ activeTab: 'prompts' });
    expect(screen.getByRole('button', { name: 'Prompts' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Certificados' })).not.toHaveAttribute('aria-current');
  });

  it('calls setActiveTab with the clicked tab id', async () => {
    const user = userEvent.setup();
    const { setActiveTab } = renderNavbar();
    await user.click(screen.getByRole('button', { name: 'Desafios' }));
    expect(setActiveTab).toHaveBeenCalledWith('challenges');
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
});
