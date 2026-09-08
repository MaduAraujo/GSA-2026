import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PwaGuideModal } from './PwaGuideModal';

describe('PwaGuideModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <PwaGuideModal isOpen={false} onClose={vi.fn()} deferredPrompt={null} onInstall={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('hides the one-click install button when no deferred prompt is available', () => {
    render(<PwaGuideModal isOpen onClose={vi.fn()} deferredPrompt={null} onInstall={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Instalar Aplicativo Agora/ })).not.toBeInTheDocument();
    expect(screen.getByText('Android (Google Chrome)')).toBeInTheDocument();
  });

  it('installs and closes when the one-click button is available and clicked', async () => {
    const user = userEvent.setup();
    const onInstall = vi.fn();
    const onClose = vi.fn();
    render(<PwaGuideModal isOpen onClose={onClose} deferredPrompt={{}} onInstall={onInstall} />);

    await user.click(screen.getByRole('button', { name: /Instalar Aplicativo Agora/ }));
    expect(onInstall).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose from the header and footer controls', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PwaGuideModal isOpen onClose={onClose} deferredPrompt={null} onInstall={vi.fn()} />);

    await user.click(screen.getByLabelText('Fechar'));
    await user.click(screen.getByRole('button', { name: 'Entendi' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
