import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetPasswordScreen } from './ResetPasswordScreen';

const { updateUser, signOut } = vi.hoisted(() => ({
  updateUser: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('../../services/supabaseClient', () => ({ supabase: { auth: { updateUser, signOut } } }));

const { isPasswordLeaked } = vi.hoisted(() => ({ isPasswordLeaked: vi.fn().mockResolvedValue(false) }));
vi.mock('../../utils/passwordSecurity', () => ({ isPasswordLeaked }));

const fill = async (user: ReturnType<typeof userEvent.setup>, password: string, confirm: string) => {
  await user.type(screen.getByLabelText('Nova senha'), password);
  await user.type(screen.getByLabelText('Confirmar nova senha'), confirm);
  await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
};

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    updateUser.mockReset().mockResolvedValue({ error: null });
    isPasswordLeaked.mockReset().mockResolvedValue(false);
  });

  it('saves the new password and shows the success state', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<ResetPasswordScreen onDone={onDone} onCancel={vi.fn()} />);

    await fill(user, 'novaSenha1', 'novaSenha1');

    expect(updateUser).toHaveBeenCalledWith({ password: 'novaSenha1' });
    expect(await screen.findByText('Senha atualizada!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ir para o Hub' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('rejects passwords that do not match', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordScreen onDone={vi.fn()} onCancel={vi.fn()} />);

    await fill(user, 'novaSenha1', 'outraSenha1');

    expect(await screen.findByText(/não são iguais/)).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('rejects passwords shorter than six characters', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordScreen onDone={vi.fn()} onCancel={vi.fn()} />);

    await fill(user, '123', '123');

    expect(await screen.findByText(/pelo menos 6 caracteres/)).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('blocks passwords found in known breaches', async () => {
    isPasswordLeaked.mockResolvedValueOnce(true);
    const user = userEvent.setup();
    render(<ResetPasswordScreen onDone={vi.fn()} onCancel={vi.fn()} />);

    await fill(user, 'senha123', 'senha123');

    expect(await screen.findByText(/vazamentos conhecidos/)).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('explains when the new password equals the current one', async () => {
    updateUser.mockResolvedValueOnce({ error: { code: 'same_password', message: 'New password should be different' } });
    const user = userEvent.setup();
    render(<ResetPasswordScreen onDone={vi.fn()} onCancel={vi.fn()} />);

    await fill(user, 'mesmaSenha1', 'mesmaSenha1');

    expect(await screen.findByText('A nova senha precisa ser diferente da senha atual.')).toBeInTheDocument();
  });

  it('signs out and leaves when cancelled', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ResetPasswordScreen onDone={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar e sair' }));

    expect(signOut).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
