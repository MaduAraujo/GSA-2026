import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileModal } from './ProfileModal';
import { AmbassadorProfile } from '../types';
import { makeProfile } from '../test/factories';

vi.mock('../services/pushNotifications', () => ({
  PushNotificationsService: {
    getCurrentSubscription: vi.fn().mockResolvedValue(null),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    sendTestPush: vi.fn(),
  },
}));

describe('ProfileModal', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <ProfileModal isOpen={false} onClose={vi.fn()} profile={makeProfile()} onSaveProfile={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('prefills the form with the current profile and saves edits', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    const onSaveProfile = vi.fn();
    const onClose = vi.fn();
    render(
      <ProfileModal isOpen onClose={onClose} profile={makeProfile({ name: 'Ana Souza' })} onSaveProfile={onSaveProfile} />
    );

    const nameInput = screen.getByDisplayValue('Ana Souza');
    await user.clear(nameInput);
    await user.type(nameInput, 'Ana Beatriz');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSaveProfile).toHaveBeenCalledTimes(1);
    expect((onSaveProfile.mock.calls[0][0] as AmbassadorProfile).name).toBe('Ana Beatriz');

    vi.advanceTimersByTime(800);
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('shows an unsupported message when enabling reminders in an environment without Notification support', async () => {
    const user = userEvent.setup();
    render(<ProfileModal isOpen onClose={vi.fn()} profile={makeProfile()} onSaveProfile={vi.fn()} />);
    const remindersSection = screen.getByText('Lembretes semanais de conteúdo').closest('.p-4') as HTMLElement;
    await user.click(within(remindersSection).getByRole('button', { name: 'Ativar' }));
    expect(await screen.findByText('Seu navegador não suporta notificações.')).toBeInTheDocument();
  });

  it('turns on the public portfolio toggle and shows a shareable link', async () => {
    const user = userEvent.setup();
    render(<ProfileModal isOpen onClose={vi.fn()} profile={makeProfile({ isPublic: false, publicSlug: undefined })} onSaveProfile={vi.fn()} />);

    const portfolioSection = screen.getByText('Portfólio público').closest('.p-4') as HTMLElement;
    const portfolioToggle = within(portfolioSection).getByRole('button', { name: 'Ativar' });
    expect(portfolioToggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(portfolioToggle);
    expect(portfolioToggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Copiar link do portfólio')).toBeInTheDocument();
  });

  it('rejects an avatar larger than 2MB', async () => {
    const user = userEvent.setup();
    render(<ProfileModal isOpen onClose={vi.fn()} profile={makeProfile()} onSaveProfile={vi.fn()} />);
    await user.click(screen.getByLabelText('Opções da foto de perfil'));
    await user.click(screen.getByText('Adicionar foto'));

    const bigFile = new File([new Uint8Array(3 * 1024 * 1024)], 'avatar.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, bigFile);

    expect(await screen.findByRole('alert')).toHaveTextContent(/Imagem muito grande/);
  });
});