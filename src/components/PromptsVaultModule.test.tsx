import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PromptsVaultModule } from './PromptsVaultModule';
import { PromptItem } from '../types';
import { makePrompt } from '../test/factories';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

function renderModule(overrides: Partial<React.ComponentProps<typeof PromptsVaultModule>> = {}) {
  const props = {
    prompts: [] as PromptItem[],
    onSavePrompt: vi.fn().mockResolvedValue(undefined),
    onDeletePrompt: vi.fn(),
    promptDocs: [],
    onSavePromptDoc: vi.fn(),
    onDeletePromptDoc: vi.fn(),
    ...overrides,
  };
  render(<PromptsVaultModule {...props} />);
  return props;
}

describe('PromptsVaultModule', () => {
  it('shows an empty state when there are no prompts', () => {
    renderModule();
    expect(screen.getByText('Nenhum prompt encontrado')).toBeInTheDocument();
  });

  it('filters prompts by search query', async () => {
    const user = userEvent.setup();
    renderModule({
      prompts: [makePrompt({ id: 'p1', title: 'Plano de estudos GenAI' }), makePrompt({ id: 'p2', title: 'Roteiro de evento', promptText: 'organize um evento', tags: ['eventos'] })],
    });
    await user.type(document.getElementById('search-prompts-input') as HTMLInputElement, 'genai');
    expect(screen.getByText('Plano de estudos GenAI')).toBeInTheDocument();
    expect(screen.queryByText('Roteiro de evento')).not.toBeInTheDocument();
  });

  it('filters prompts by section chip', async () => {
    const user = userEvent.setup();
    renderModule({
      prompts: [makePrompt({ id: 'p1', title: 'Prompt A', section: 'Estudos' }), makePrompt({ id: 'p2', title: 'Prompt B', section: 'Comunidade' })],
    });
    await user.click(screen.getByRole('button', { name: 'Comunidade' }));
    expect(screen.getByText('Prompt B')).toBeInTheDocument();
    expect(screen.queryByText('Prompt A')).not.toBeInTheDocument();
  });

  it('toggles the favorites-only filter', async () => {
    const user = userEvent.setup();
    renderModule({
      prompts: [makePrompt({ id: 'p1', title: 'Favorito', isFavorite: true }), makePrompt({ id: 'p2', title: 'Comum', isFavorite: false })],
    });
    const favBtn = screen.getByRole('button', { name: 'Favoritos' });
    await user.click(favBtn);
    expect(screen.getByText('Favorito')).toBeInTheDocument();
    expect(screen.queryByText('Comum')).not.toBeInTheDocument();
  });

  it('keeps the submit button disabled until title and prompt text are filled', async () => {
    const user = userEvent.setup();
    renderModule();
    await user.click(screen.getByLabelText('Novo prompt'));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByRole('button', { name: 'Salvar' })).toBeDisabled();

    const textboxes = within(dialog).getAllByRole('textbox');
    const titleInput = textboxes[0];
    const promptTextInput = textboxes.find((el) => el.tagName === 'TEXTAREA') as HTMLTextAreaElement;
    await user.type(titleInput, 'Meu novo prompt');
    expect(within(dialog).getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await user.type(promptTextInput, 'Texto do prompt de teste');
    expect(within(dialog).getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });

  it('creates a prompt with the default section and model', async () => {
    const user = userEvent.setup();
    const onSavePrompt = vi.fn().mockResolvedValue(undefined);
    renderModule({ onSavePrompt });
    await user.click(screen.getByLabelText('Novo prompt'));
    const dialog = screen.getByRole('dialog');

    const textboxes = within(dialog).getAllByRole('textbox');
    const titleInput = textboxes[0];
    const promptTextInput = textboxes.find((el) => el.tagName === 'TEXTAREA') as HTMLTextAreaElement;
    await user.type(titleInput, 'Meu novo prompt');
    await user.type(promptTextInput, 'Texto do prompt de teste');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSavePrompt).toHaveBeenCalledTimes(1));
    const saved = onSavePrompt.mock.calls[0][0] as PromptItem;
    expect(saved.title).toBe('Meu novo prompt');
    expect(saved.promptText).toBe('Texto do prompt de teste');
    expect(saved.section).toBe('Estudos');
    expect(saved.recommendedModel).toBe('gemini-3.7-flash');
  });

  it('asks for confirmation before deleting and aborts when declined', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDeletePrompt = vi.fn();
    renderModule({ prompts: [makePrompt()], onDeletePrompt });

    await user.click(screen.getByLabelText('Excluir'));
    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeletePrompt).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('copies the prompt text to the clipboard and bumps its usage count', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const onSavePrompt = vi.fn().mockResolvedValue(undefined);
    renderModule({ prompts: [makePrompt({ promptText: 'Texto original', usageCount: 3 })], onSavePrompt });

    await user.click(screen.getByRole('button', { name: /Copiar/ }));

    expect(writeText).toHaveBeenCalledWith('Texto original');
    await waitFor(() => expect(onSavePrompt).toHaveBeenCalledTimes(1));
    expect(onSavePrompt.mock.calls[0][0].usageCount).toBe(4);
  });
});
