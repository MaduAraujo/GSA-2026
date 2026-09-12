import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReferenceLinksModule } from './ReferenceLinksModule';
import { ReferenceLink } from '../types';
import { makeReferenceLink } from '../test/factories';

describe('ReferenceLinksModule', () => {
  it('shows an empty state when there are no reference links', () => {
    render(<ReferenceLinksModule referenceLinks={[]} onSaveReferenceLink={vi.fn()} onDeleteReferenceLink={vi.fn()} />);
    expect(screen.getByText('Nenhum link registrado')).toBeInTheDocument();
  });

  it('renders each link as a clickable, safe external link', () => {
    render(
      <ReferenceLinksModule
        referenceLinks={[makeReferenceLink({ id: 'r1', title: 'Portfólio da Ana', url: 'https://example.com/ana' })]}
        onSaveReferenceLink={vi.fn()}
        onDeleteReferenceLink={vi.fn()}
      />
    );
    const link = screen.getByRole('link', { name: /Portfólio da Ana/ });
    expect(link).toHaveAttribute('href', 'https://example.com/ana');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('does not render an unsafe url as a clickable link', () => {
    render(
      <ReferenceLinksModule
        referenceLinks={[makeReferenceLink({ id: 'r1', title: 'Link suspeito', url: 'javascript:alert(1)' })]}
        onSaveReferenceLink={vi.fn()}
        onDeleteReferenceLink={vi.fn()}
      />
    );
    expect(screen.queryByRole('link', { name: /Link suspeito/ })).not.toBeInTheDocument();
    expect(screen.getByText('Link suspeito')).toBeInTheDocument();
  });

  it('keeps the submit button disabled until title and url are filled', async () => {
    const user = userEvent.setup();
    render(<ReferenceLinksModule referenceLinks={[]} onSaveReferenceLink={vi.fn()} onDeleteReferenceLink={vi.fn()} />);
    await user.click(screen.getByLabelText('Novo link de referência'));

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    const titleInput = within(screen.getByRole('dialog')).getAllByRole('textbox')[0];
    await user.type(titleInput, 'Portfólio da Ana');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('https://...'), 'https://example.com/ana');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });

  it('creates a reference link with the trimmed fields', async () => {
    const user = userEvent.setup();
    const onSaveReferenceLink = vi.fn().mockResolvedValue(undefined);
    render(<ReferenceLinksModule referenceLinks={[]} onSaveReferenceLink={onSaveReferenceLink} onDeleteReferenceLink={vi.fn()} />);
    await user.click(screen.getByLabelText('Novo link de referência'));

    const titleInput = within(screen.getByRole('dialog')).getAllByRole('textbox')[0];
    await user.type(titleInput, '  Portfólio da Ana  ');
    await user.type(screen.getByPlaceholderText('https://...'), 'https://example.com/ana');
    await user.type(screen.getByPlaceholderText('Ex: Ana Souza'), '  Ana Souza  ');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSaveReferenceLink).toHaveBeenCalledTimes(1));
    const saved = onSaveReferenceLink.mock.calls[0][0] as ReferenceLink;
    expect(saved.title).toBe('Portfólio da Ana');
    expect(saved.url).toBe('https://example.com/ana');
    expect(saved.sharedBy).toBe('Ana Souza');
  });

  it('rejects a link that is not a valid http(s) url', async () => {
    const user = userEvent.setup();
    const onSaveReferenceLink = vi.fn();
    render(<ReferenceLinksModule referenceLinks={[]} onSaveReferenceLink={onSaveReferenceLink} onDeleteReferenceLink={vi.fn()} />);
    await user.click(screen.getByLabelText('Novo link de referência'));

    const titleInput = within(screen.getByRole('dialog')).getAllByRole('textbox')[0];
    await user.type(titleInput, 'Portfólio da Ana');
    await user.type(screen.getByPlaceholderText('https://...'), 'javascript:alert(1)');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/link válido/);
    expect(onSaveReferenceLink).not.toHaveBeenCalled();
  });

  it('opens the edit form pre-filled when a link is edited', async () => {
    const user = userEvent.setup();
    render(
      <ReferenceLinksModule
        referenceLinks={[makeReferenceLink({ id: 'r1', title: 'Portfólio da Ana' })]}
        onSaveReferenceLink={vi.fn()}
        onDeleteReferenceLink={vi.fn()}
      />
    );
    await user.click(screen.getByLabelText('Editar link'));
    expect(within(screen.getByRole('dialog')).getByText('Editar Link')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Portfólio da Ana')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting a reference link', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDeleteReferenceLink = vi.fn();
    render(
      <ReferenceLinksModule
        referenceLinks={[makeReferenceLink({ id: 'r1' })]}
        onSaveReferenceLink={vi.fn()}
        onDeleteReferenceLink={onDeleteReferenceLink}
      />
    );

    await user.click(screen.getByLabelText('Excluir link'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteReferenceLink).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
