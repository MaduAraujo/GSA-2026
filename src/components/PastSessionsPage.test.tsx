import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PastSessionsList } from './PastSessionsPage';
import type { SessionSummary } from '../types';

const summary = (sessionId: string): SessionSummary => ({
  sessionId,
  fileName: 'resumo.pdf',
  filePath: `u1/session-summaries/${sessionId}-resumo.pdf`,
  url: `https://signed.example/${sessionId}`,
  createdAt: '2026-10-14T12:00:00Z',
});

const renderList = (props: Partial<React.ComponentProps<typeof PastSessionsList>> = {}) => {
  const onUpload = props.onUpload ?? vi.fn().mockResolvedValue(undefined);
  render(<PastSessionsList summaries={[]} isLoading={false} {...props} onUpload={onUpload} />);
  return { onUpload };
};

describe('PastSessionsList', () => {
  it('shows the heading, intro and each past session with date and team leaders', () => {
    renderList();
    expect(screen.getByRole('heading', { name: 'REVISITE OS MOMENTOS DA JORNADA' })).toBeInTheDocument();
    expect(screen.getByText(/guarde o seu resumo de cada encontro/)).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(10);
    expect(items[0]).toHaveTextContent('Sessão 01 de Google Gemini');
    expect(items[0]).toHaveTextContent('Study Notebooks');
    expect(items[0]).toHaveTextContent('28/08');
    expect(items[0]).toHaveTextContent('Júlia Pavão G6, Estêvão Zilioli (Time Amplifica)');
    expect(items[1]).toHaveTextContent('Canvas com base de dados');
    expect(items[1]).toHaveTextContent('04/09');
  });

  it('labels each person by role and omits the series when there is none', () => {
    renderList();
    const items = screen.getAllByRole('listitem');
    expect(items[3]).toHaveTextContent('Creator:Otávio Pompeu');
    expect(items[3]).toHaveTextContent('Team Leader:Iolanda França');
    expect(items[4]).toHaveTextContent('Googler:Bernardo Barlach, Gerente de Programa');
    expect(items[6]).toHaveTextContent('Café com Team Leaders');
    expect(items[6]!.querySelector('p.uppercase')).toBeNull();
  });

  it('offers an upload on every session without a summary', () => {
    renderList();
    expect(screen.getAllByRole('button', { name: 'Enviar resumo' })).toHaveLength(10);
    expect(screen.queryByRole('link', { name: /Ver resumo/ })).not.toBeInTheDocument();
  });

  it('shows only "Ver resumo" once a session has a summary', () => {
    renderList({ summaries: [summary('gemini-01-study-notebooks')] });
    const first = screen.getAllByRole('listitem')[0]!;
    const link = screen.getByRole('link', { name: /Ver resumo/ });
    expect(first).toContainElement(link);
    expect(link).toHaveAttribute('href', 'https://signed.example/gemini-01-study-notebooks');
    expect(link).toHaveAttribute('target', '_blank');
    expect(first.querySelector('button')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Enviar resumo' })).toHaveLength(9);
  });

  it('uploads the chosen file for that session', async () => {
    const user = userEvent.setup();
    const { onUpload } = renderList();
    const file = new File(['conteúdo'], 'resumo.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText('Arquivo do resumo de Study Notebooks'), file);
    expect(onUpload).toHaveBeenCalledWith('gemini-01-study-notebooks', file);
  });

  it('rejects files over 50MB without uploading', async () => {
    const user = userEvent.setup();
    const { onUpload } = renderList();
    const big = new File(['x'], 'grande.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 51 * 1024 * 1024 });
    await user.upload(screen.getByLabelText('Arquivo do resumo de Gemini Live'), big);
    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('O limite é 50MB');
  });

  it('shows an error when the upload fails', async () => {
    const user = userEvent.setup();
    renderList({ onUpload: vi.fn().mockRejectedValue(new Error('boom')) });
    await user.upload(
      screen.getByLabelText('Arquivo do resumo de Apps conectados'),
      new File(['x'], 'r.pdf', { type: 'application/pdf' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível enviar o resumo');
    expect(screen.getAllByRole('button', { name: 'Enviar resumo' })).toHaveLength(10);
  });

  it('hides the actions while summaries are loading', () => {
    renderList({ isLoading: true });
    expect(screen.queryByRole('button', { name: 'Enviar resumo' })).not.toBeInTheDocument();
  });
});
