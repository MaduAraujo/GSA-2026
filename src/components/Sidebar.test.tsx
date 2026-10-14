import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import { renderWithProviders } from '../test/render';

describe('Sidebar', () => {
  beforeEach(() => localStorage.clear());

  it('marks the active tab with aria-current and links each tab to its URL', () => {
    renderWithProviders(<Sidebar activeTab="prompts" />);
    expect(screen.getByRole('link', { name: 'Prompts' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Certificados' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Desafios' })).toHaveAttribute('href', '/desafios');
  });

  it('links Suporte to the support page and highlights it when active', () => {
    renderWithProviders(<Sidebar activeTab={null} activePage="support" />);
    const link = screen.getByRole('link', { name: 'Suporte' });
    expect(link).toHaveAttribute('href', '/suporte');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Certificados' })).not.toHaveAttribute('aria-current');
  });

  it('links Diretrizes to the guidelines page', () => {
    renderWithProviders(<Sidebar activeTab={null} activePage="guidelines" />);
    const link = screen.getByRole('link', { name: 'Diretrizes' });
    expect(link).toHaveAttribute('href', '/diretrizes');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Suporte' })).not.toHaveAttribute('aria-current');
  });

  it('links Agenda to the agenda page', () => {
    renderWithProviders(<Sidebar activeTab={null} activePage="agenda" />);
    const link = screen.getByRole('link', { name: 'Agenda' });
    expect(link).toHaveAttribute('href', '/agenda');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('links Acervo de Encontros to the past sessions page', () => {
    renderWithProviders(<Sidebar activeTab={null} activePage="pastSessions" />);
    const link = screen.getByRole('link', { name: 'Acervo de Encontros' });
    expect(link).toHaveAttribute('href', '/acervo');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('collapses to icons only and remembers the choice', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<Sidebar activeTab="certificates" />);
    expect(screen.getByText('Certificados')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Recolher barra lateral' }));
    expect(screen.queryByText('Certificados')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Certificados' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Suporte' })).toBeInTheDocument();

    unmount();
    renderWithProviders(<Sidebar activeTab="certificates" />);
    expect(screen.getByRole('button', { name: 'Expandir barra lateral' })).toBeInTheDocument();
  });

  describe('on mobile', () => {
    beforeEach(() => {
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }));
    });
    afterEach(() => vi.unstubAllGlobals());

    it('is an inert off-canvas drawer while closed', () => {
      renderWithProviders(<Sidebar activeTab="certificates" />);
      expect(document.getElementById('app-sidebar')).toHaveAttribute('inert');
      expect(screen.queryByRole('button', { name: 'Recolher barra lateral' })).not.toBeInTheDocument();
    });

    it('shows every tab and Suporte with labels when open, and closes on link click or Escape', async () => {
      const user = userEvent.setup();
      localStorage.setItem('gsa_sidebar_collapsed', 'true');
      const onMobileClose = vi.fn();
      renderWithProviders(<Sidebar activeTab="certificates" mobileOpen onMobileClose={onMobileClose} />);

      expect(document.getElementById('app-sidebar')).not.toHaveAttribute('inert');
      expect(screen.getByText('Certificados')).toBeInTheDocument();
      expect(screen.getByText('Suporte')).toBeInTheDocument();

      await user.click(screen.getByRole('link', { name: 'Desafios' }));
      expect(onMobileClose).toHaveBeenCalledTimes(1);

      await user.keyboard('{Escape}');
      expect(onMobileClose).toHaveBeenCalledTimes(2);

      await user.click(screen.getByRole('button', { name: 'Fechar menu' }));
      expect(onMobileClose).toHaveBeenCalledTimes(3);
    });
  });
});
