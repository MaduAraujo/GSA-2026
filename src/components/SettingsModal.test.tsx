import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsModal } from './SettingsModal';

describe('SettingsModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <SettingsModal isOpen={false} onClose={vi.fn()} isDarkMode={false} onToggleDarkMode={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('reflects the current dark mode state', () => {
    render(<SettingsModal isOpen onClose={vi.fn()} isDarkMode={true} onToggleDarkMode={vi.fn()} />);
    expect(screen.getByRole('switch', { name: 'Alternar modo escuro' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Ativado')).toBeInTheDocument();
  });

  it('calls onToggleDarkMode when the switch is clicked', async () => {
    const user = userEvent.setup();
    const onToggleDarkMode = vi.fn();
    render(<SettingsModal isOpen onClose={vi.fn()} isDarkMode={false} onToggleDarkMode={onToggleDarkMode} />);
    await user.click(screen.getByRole('switch', { name: 'Alternar modo escuro' }));
    expect(onToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  it('only enables permanent deletion after typing the confirmation word', async () => {
    const user = userEvent.setup();
    const onDeleteAccount = vi.fn(() => Promise.resolve());
    const onClose = vi.fn();
    render(
      <SettingsModal
        isOpen
        onClose={onClose}
        isDarkMode={false}
        onToggleDarkMode={vi.fn()}
        onDeleteAccount={onDeleteAccount}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Excluir conta…' }));
    const confirm = screen.getByRole('button', { name: 'Excluir permanentemente' });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/Para confirmar/), 'excluir');
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    expect(onDeleteAccount).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the error and keeps the modal open when deletion fails', async () => {
    const user = userEvent.setup();
    const onDeleteAccount = vi.fn(() => Promise.reject(new Error('Servidor indisponível.')));
    const onClose = vi.fn();
    render(
      <SettingsModal
        isOpen
        onClose={onClose}
        isDarkMode={false}
        onToggleDarkMode={vi.fn()}
        onDeleteAccount={onDeleteAccount}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Excluir conta…' }));
    await user.type(screen.getByLabelText(/Para confirmar/), 'EXCLUIR');
    await user.click(screen.getByRole('button', { name: 'Excluir permanentemente' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor indisponível.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose from both the header and footer close controls', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SettingsModal isOpen onClose={onClose} isDarkMode={false} onToggleDarkMode={vi.fn()} />);

    await user.click(screen.getByLabelText('Fechar'));
    await user.click(screen.getByRole('button', { name: 'Concluído' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
