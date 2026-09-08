import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AmbassadorAreaModal } from './AmbassadorAreaModal';
import { AmbassadorProfile } from '../types';
import { makeProfile } from '../test/factories';

describe('AmbassadorAreaModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <AmbassadorAreaModal isOpen={false} onClose={vi.fn()} profile={makeProfile()} onSaveProfile={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the ambassador role and an upload prompt when there is no seal yet', () => {
    render(
      <AmbassadorAreaModal
        isOpen
        onClose={vi.fn()}
        profile={makeProfile({ ambassadorSealUrl: undefined })}
        onSaveProfile={vi.fn()}
      />
    );
    expect(screen.getByText('O Papel do(a) Embaixador(a)')).toBeInTheDocument();
    expect(screen.getByText('Selo Embaixador(a)')).toBeInTheDocument();
    expect(screen.getByText('Faça upload do selo')).toBeInTheDocument();
  });

  it('uploads a seal image and saves it on the profile', async () => {
    const user = userEvent.setup();
    const onSaveProfile = vi.fn();
    render(
      <AmbassadorAreaModal
        isOpen
        onClose={vi.fn()}
        profile={makeProfile({ ambassadorSealUrl: undefined })}
        onSaveProfile={onSaveProfile}
      />
    );

    const file = new File([new Uint8Array(10)], 'selo.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(await screen.findByAltText('Selo Embaixador(a)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSaveProfile).toHaveBeenCalledTimes(1);
    expect((onSaveProfile.mock.calls[0][0] as AmbassadorProfile).ambassadorSealUrl).toMatch(/^data:image\/png/);
  });

  it('rejects a seal image larger than 3MB', async () => {
    const user = userEvent.setup();
    render(<AmbassadorAreaModal isOpen onClose={vi.fn()} profile={makeProfile()} onSaveProfile={vi.fn()} />);

    const bigFile = new File([new Uint8Array(4 * 1024 * 1024)], 'selo.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, bigFile);

    expect(await screen.findByRole('alert')).toHaveTextContent(/Imagem muito grande/);
  });

  it('removes an existing seal', async () => {
    const user = userEvent.setup();
    render(
      <AmbassadorAreaModal
        isOpen
        onClose={vi.fn()}
        profile={makeProfile({ ambassadorSealUrl: 'data:image/png;base64,AAA' })}
        onSaveProfile={vi.fn()}
      />
    );

    expect(screen.getByAltText('Selo Embaixador(a)')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Opções do selo'));
    await user.click(screen.getByRole('button', { name: 'Remover' }));
    expect(screen.queryByAltText('Selo Embaixador(a)')).not.toBeInTheDocument();
    expect(screen.getByText('Faça upload do selo')).toBeInTheDocument();
  });

  it('swaps the seal image via the options menu', async () => {
    const user = userEvent.setup();
    render(
      <AmbassadorAreaModal
        isOpen
        onClose={vi.fn()}
        profile={makeProfile({ ambassadorSealUrl: 'data:image/png;base64,AAA' })}
        onSaveProfile={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText('Opções do selo'));
    await user.click(screen.getByRole('button', { name: 'Trocar imagem' }));

    const file = new File([new Uint8Array(10)], 'novo-selo.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByAltText('Selo Embaixador(a)')).toBeInTheDocument();
  });
});
