import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChallengesModule } from './ChallengesModule';
import { Challenge } from '../types';
import { makeChallenge } from '../test/factories';

describe('ChallengesModule', () => {
  it('shows an empty state when there are no challenges', () => {
    render(<ChallengesModule challenges={[]} posts={[]} onSaveChallenge={vi.fn()} onDeleteChallenge={vi.fn()} onSavePost={vi.fn()} onDeletePost={vi.fn()} />);
    expect(screen.getByText('Nenhum desafio encontrado')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    render(
      <ChallengesModule
        challenges={[makeChallenge({ id: 'c1', title: 'Desafio pendente', status: 'Pendente' }), makeChallenge({ id: 'c2', title: 'Desafio feito', status: 'Concluído' })]}
        posts={[]}
        onSaveChallenge={vi.fn()}
        onDeleteChallenge={vi.fn()}
        onSavePost={vi.fn()}
        onDeletePost={vi.fn()}
      />
    );
    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'Concluído');
    expect(screen.getByText('Desafio feito')).toBeInTheDocument();
    expect(screen.queryByText('Desafio pendente')).not.toBeInTheDocument();
  });

  it('filters by category chip', async () => {
    const user = userEvent.setup();
    render(
      <ChallengesModule
        challenges={[makeChallenge({ id: 'c1', title: 'A', category: 'Comunidade' }), makeChallenge({ id: 'c2', title: 'B', category: 'Conteúdo' })]}
        posts={[]}
        onSaveChallenge={vi.fn()}
        onDeleteChallenge={vi.fn()}
        onSavePost={vi.fn()}
        onDeletePost={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Conteúdo' }));
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  it('never renders a javascript: URI as the challenge link (XSS guard)', () => {
    render(
      <ChallengesModule
        challenges={[makeChallenge({ link: 'javascript:alert(1)' })]}
        posts={[]}
        onSaveChallenge={vi.fn()}
        onDeleteChallenge={vi.fn()}
        onSavePost={vi.fn()}
        onDeletePost={vi.fn()}
      />
    );
    expect(screen.queryByRole('link', { name: /Detalhes/ })).not.toBeInTheDocument();
  });

  it('renders an http(s) challenge link', () => {
    render(
      <ChallengesModule
        challenges={[makeChallenge({ link: 'https://example.com/desafio' })]}
        posts={[]}
        onSaveChallenge={vi.fn()}
        onDeleteChallenge={vi.fn()}
        onSavePost={vi.fn()}
        onDeletePost={vi.fn()}
      />
    );
    expect(screen.getByRole('link', { name: /Detalhes/ })).toHaveAttribute('href', 'https://example.com/desafio');
  });

  it('cycles the status forward when the status badge is clicked', async () => {
    const user = userEvent.setup();
    const onSaveChallenge = vi.fn().mockResolvedValue(undefined);
    render(
      <ChallengesModule
        challenges={[makeChallenge({ status: 'Pendente' })]}
        posts={[]}
        onSaveChallenge={onSaveChallenge}
        onDeleteChallenge={vi.fn()}
        onSavePost={vi.fn()}
        onDeletePost={vi.fn()}
      />
    );
    await user.click(screen.getByTitle('Clique para avançar o status'));
    await waitFor(() => expect(onSaveChallenge).toHaveBeenCalledTimes(1));
    expect(onSaveChallenge.mock.calls[0][0].status).toBe('Em Andamento');
  });

  it('asks for confirmation before deleting and aborts when declined', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDeleteChallenge = vi.fn();
    render(
      <ChallengesModule
        challenges={[makeChallenge()]}
        posts={[]}
        onSaveChallenge={vi.fn()}
        onDeleteChallenge={onDeleteChallenge}
        onSavePost={vi.fn()}
        onDeletePost={vi.fn()}
      />
    );
    await user.click(screen.getByLabelText('Excluir desafio'));
    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteChallenge).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('keeps the submit button disabled until title and description are filled', async () => {
    const user = userEvent.setup();
    render(<ChallengesModule challenges={[]} posts={[]} onSaveChallenge={vi.fn()} onDeleteChallenge={vi.fn()} onSavePost={vi.fn()} onDeletePost={vi.fn()} />);
    await user.click(screen.getByLabelText('Novo desafio'));

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await user.type(document.getElementById('challenge-form-title') as HTMLInputElement, 'Novo desafio de teste');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    const textareas = screen.getAllByRole('textbox').filter((el) => el.tagName === 'TEXTAREA');
    await user.type(textareas[0], 'Descrição do desafio');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });

  it('creates a challenge without linking a post when no social links are added', async () => {
    const user = userEvent.setup();
    const onSaveChallenge = vi.fn().mockResolvedValue(undefined);
    const onSavePost = vi.fn();
    render(<ChallengesModule challenges={[]} posts={[]} onSaveChallenge={onSaveChallenge} onDeleteChallenge={vi.fn()} onSavePost={onSavePost} onDeletePost={vi.fn()} />);
    await user.click(screen.getByLabelText('Novo desafio'));

    await user.type(document.getElementById('challenge-form-title') as HTMLInputElement, '  Meu desafio  ');
    const textareas = screen.getAllByRole('textbox').filter((el) => el.tagName === 'TEXTAREA');
    await user.type(textareas[0], '  Minha descrição  ');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSaveChallenge).toHaveBeenCalledTimes(1));
    const saved = onSaveChallenge.mock.calls[0][0] as Challenge;
    expect(saved.title).toBe('Meu desafio');
    expect(saved.description).toBe('Minha descrição');
    expect(saved.status).toBe('Pendente');
    expect(onSavePost).not.toHaveBeenCalled();
  });
});
