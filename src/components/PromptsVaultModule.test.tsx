import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, type ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../app/ToastProvider';
import { PromptsVaultModule } from './PromptsVaultModule';
import { type PromptItem } from '../types';
import { makePrompt } from '../test/factories';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const { enhancePromptMock, sendChatMessageMock } = vi.hoisted(() => ({
  enhancePromptMock: vi.fn(),
  sendChatMessageMock: vi.fn(),
}));
vi.mock('../services/aiApi', () => ({
  AiApiService: { enhancePrompt: enhancePromptMock, sendChatMessage: sendChatMessageMock },
}));

const locationLog: string[] = [];
function LocationSpy() {
  const { search } = useLocation();
  useEffect(() => {
    locationLog.push(search);
  }, [search]);
  return null;
}
const currentSearch = () => new URLSearchParams(locationLog.at(-1) ?? '');

function renderModule(
  overrides: Partial<React.ComponentProps<typeof PromptsVaultModule>> = {},
  { initialUrl = '/prompts' }: { initialUrl?: string } = {},
) {
  const props = {
    prompts: [] as PromptItem[],
    onSavePrompt: vi.fn().mockResolvedValue(undefined),
    onDeletePrompt: vi.fn().mockResolvedValue(undefined),
    promptDocs: [],
    onSavePromptDoc: vi.fn(),
    onDeletePromptDoc: vi.fn(),
    ...overrides,
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialUrl]}>
      <ToastProvider>
        {children}
        <LocationSpy />
      </ToastProvider>
    </MemoryRouter>
  );
  render(<PromptsVaultModule {...props} />, { wrapper });
  return props;
}

describe('PromptsVaultModule', () => {
  beforeEach(() => {
    sessionStorage.clear();
    enhancePromptMock.mockReset();
    sendChatMessageMock.mockReset();
  });

  it('shows an onboarding empty state with a create button when there are no prompts', async () => {
    const user = userEvent.setup();
    renderModule();
    expect(screen.getByText('Sua biblioteca de prompts está vazia')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Criar primeiro prompt' }));
    expect(screen.getByText('Cadastrar Prompt')).toBeInTheDocument();
  });

  it('explains an empty search and lets the user clear every filter', async () => {
    const user = userEvent.setup();
    renderModule({ prompts: [makePrompt({ title: 'Plano de estudos', isFavorite: false })] });

    await user.click(screen.getByRole('button', { name: 'Favoritos' }));
    await user.type(document.getElementById('search-prompts-input') as HTMLInputElement, 'xyz');
    expect(screen.getByText('Nenhum prompt encontrado')).toBeInTheDocument();
    expect(screen.getByText('“xyz”')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByText('Plano de estudos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Favoritos' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('filters prompts by search query', async () => {
    const user = userEvent.setup();
    renderModule({
      prompts: [
        makePrompt({ id: 'p1', title: 'Plano de estudos GenAI' }),
        makePrompt({ id: 'p2', title: 'Roteiro de evento', promptText: 'organize um evento', tags: ['eventos'] }),
      ],
    });
    await user.type(document.getElementById('search-prompts-input') as HTMLInputElement, 'genai');
    expect(screen.getByText('Plano de estudos GenAI')).toBeInTheDocument();
    expect(screen.queryByText('Roteiro de evento')).not.toBeInTheDocument();
  });

  it('filters prompts by section chip', async () => {
    const user = userEvent.setup();
    renderModule({
      prompts: [
        makePrompt({ id: 'p1', title: 'Prompt A', section: 'Estudos' }),
        makePrompt({ id: 'p2', title: 'Prompt B', section: 'Comunidade' }),
      ],
    });
    await user.click(screen.getByRole('button', { name: 'Comunidade' }));
    expect(screen.getByText('Prompt B')).toBeInTheDocument();
    expect(screen.queryByText('Prompt A')).not.toBeInTheDocument();
  });

  it('lists every existing category in the form suggestion dropdown, not just the typed one', async () => {
    const user = userEvent.setup();
    renderModule({
      prompts: [
        makePrompt({ id: 'p1', title: 'Prompt A', section: 'Estudos' }),
        makePrompt({ id: 'p2', title: 'Prompt B', section: 'Comunidade' }),
      ],
    });
    await user.click(screen.getByLabelText('Novo prompt'));
    const dialog = screen.getByRole('dialog');

    const inputs = within(dialog).getAllByRole('textbox');
    const sectionInput = inputs[1] as HTMLInputElement;
    await user.type(sectionInput, 'Comunidade');

    await user.click(within(dialog).getByLabelText('Ver categorias já criadas'));
    expect(within(dialog).getByRole('option', { name: 'Estudos' })).toBeInTheDocument();
    expect(within(dialog).getByRole('option', { name: 'Comunidade' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('option', { name: 'Estudos' }));
    expect(sectionInput).toHaveValue('Estudos');
  });

  it('toggles the favorites-only filter', async () => {
    const user = userEvent.setup();
    renderModule({
      prompts: [
        makePrompt({ id: 'p1', title: 'Favorito', isFavorite: true }),
        makePrompt({ id: 'p2', title: 'Comum', isFavorite: false }),
      ],
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
    const titleInput = textboxes[0]!;
    const promptTextInput = textboxes.find((el) => el.tagName === 'TEXTAREA') as HTMLTextAreaElement;
    await user.type(titleInput, 'Meu novo prompt');
    expect(within(dialog).getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await user.type(promptTextInput, 'Texto do prompt de teste');
    expect(within(dialog).getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });

  it('creates a prompt with an empty section and the default model', async () => {
    const user = userEvent.setup();
    const onSavePrompt = vi.fn().mockResolvedValue(undefined);
    renderModule({ onSavePrompt });
    await user.click(screen.getByLabelText('Novo prompt'));
    const dialog = screen.getByRole('dialog');

    const textboxes = within(dialog).getAllByRole('textbox');
    const titleInput = textboxes[0]!;
    const promptTextInput = textboxes.find((el) => el.tagName === 'TEXTAREA') as HTMLTextAreaElement;
    await user.type(titleInput, 'Meu novo prompt');
    await user.type(promptTextInput, 'Texto do prompt de teste');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSavePrompt).toHaveBeenCalledTimes(1));
    const saved = onSavePrompt.mock.calls[0]![0] as PromptItem;
    expect(saved.title).toBe('Meu novo prompt');
    expect(saved.promptText).toBe('Texto do prompt de teste');
    expect(saved.section).toBe('');
    expect(saved.recommendedModel).toBe('gemini-3.7-flash');
  });

  it('hides a deleted prompt right away and only deletes it once the undo toast closes', async () => {
    const user = userEvent.setup();
    const { onDeletePrompt } = renderModule({ prompts: [makePrompt({ id: 'p1', title: 'Prompt X' })] });

    await user.click(screen.getByLabelText('Mais ações para Prompt X'));
    await user.click(screen.getByRole('menuitem', { name: 'Excluir' }));
    expect(screen.queryByText('Prompt X')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Prompt excluído');
    expect(onDeletePrompt).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Fechar notificação' }));
    await waitFor(() => expect(onDeletePrompt).toHaveBeenCalledWith('p1'));
  });

  it('brings a deleted prompt back when the user clicks "Desfazer"', async () => {
    const user = userEvent.setup();
    const { onDeletePrompt } = renderModule({ prompts: [makePrompt({ title: 'Prompt X' })] });

    await user.click(screen.getByLabelText('Mais ações para Prompt X'));
    await user.click(screen.getByRole('menuitem', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Desfazer' }));

    expect(screen.getByText('Prompt X')).toBeInTheDocument();
    expect(onDeletePrompt).not.toHaveBeenCalled();
  });

  it('groups enhance, edit, duplicate and delete in the card actions menu', async () => {
    const user = userEvent.setup();
    renderModule({ prompts: [makePrompt({ title: 'Prompt X' })] });

    await user.click(screen.getByLabelText('Mais ações para Prompt X'));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Aprimorar com IA',
      'Editar',
      'Duplicar',
      'Excluir',
    ]);
  });

  it('opens a prompt pre-filled for editing and saves the changes without losing its id or creation date', async () => {
    const user = userEvent.setup();
    const onSavePrompt = vi.fn().mockResolvedValue(undefined);
    const prompt = makePrompt({
      id: 'p1',
      title: 'Prompt original',
      promptText: 'Texto original',
      createdAt: '2026-01-05T00:00:00.000Z',
    });
    renderModule({ prompts: [prompt], onSavePrompt });

    await user.click(screen.getByLabelText('Mais ações para Prompt original'));
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Editar Prompt')).toBeInTheDocument();

    const titleInput = within(dialog).getAllByRole('textbox')[0]!;
    expect(titleInput).toHaveValue('Prompt original');
    await user.clear(titleInput);
    await user.type(titleInput, 'Prompt editado');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSavePrompt).toHaveBeenCalledTimes(1));
    const saved = onSavePrompt.mock.calls[0]![0] as PromptItem;
    expect(saved.id).toBe('p1');
    expect(saved.title).toBe('Prompt editado');
    expect(saved.createdAt).toBe('2026-01-05T00:00:00.000Z');
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
    expect(onSavePrompt.mock.calls[0]![0].usageCount).toBe(4);
  });

  it('asks for variable values before copying and copies the filled-in text', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderModule({
      prompts: [makePrompt({ promptText: 'Explique [TEMA] para [PUBLICO].', variables: ['TEMA', 'PUBLICO'] })],
    });

    await user.click(screen.getByRole('button', { name: /Copiar/ }));
    const dialog = screen.getByRole('dialog', { name: 'Preencher e copiar' });
    await user.type(within(dialog).getByLabelText('[TEMA]'), 'RAG');
    expect(within(dialog).getByLabelText('Prévia do prompt')).toHaveTextContent('Explique RAG para [PUBLICO].');

    await user.click(within(dialog).getByRole('button', { name: 'Copiar preenchido' }));
    expect(writeText).toHaveBeenCalledWith('Explique RAG para [PUBLICO].');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks for placeholders written in the text even when they were never declared as variables', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderModule({ prompts: [makePrompt({ promptText: 'Resuma [ARTIGO].', variables: [] })] });

    expect(screen.getByText('[ARTIGO]')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Copiar/ }));
    const dialog = screen.getByRole('dialog', { name: 'Preencher e copiar' });
    await user.type(within(dialog).getByLabelText('[ARTIGO]'), 'o paper');
    await user.click(within(dialog).getByRole('button', { name: 'Copiar preenchido' }));
    expect(writeText).toHaveBeenCalledWith('Resuma o paper.');
  });

  it('does not render an empty category pill for prompts without a category', () => {
    renderModule({ prompts: [makePrompt({ id: 'p1', section: '' })] });
    const card = document.getElementById('prompt-card-p1')!;
    expect(card.querySelectorAll('span.rounded-full')).toHaveLength(0);
  });

  it('keeps tag, variable and link text that was typed but not added with "+" when saving', async () => {
    const user = userEvent.setup();
    const onSavePrompt = vi.fn().mockResolvedValue(undefined);
    renderModule({ onSavePrompt });
    await user.click(screen.getByLabelText('Novo prompt'));
    const dialog = screen.getByRole('dialog');

    await user.type(within(dialog).getByLabelText('Título do Prompt *'), 'Prompt');
    await user.type(within(dialog).getByLabelText('Texto do Prompt *'), 'Texto');
    await user.type(within(dialog).getByLabelText('Tags de Busca'), 'carreira');
    await user.type(within(dialog).getByLabelText('Parâmetros do Prompt'), 'tema');
    await user.type(within(dialog).getByLabelText('Documentos Compartilhados'), 'docs.google.com/d/1');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSavePrompt).toHaveBeenCalledTimes(1));
    const saved = onSavePrompt.mock.calls[0]![0] as PromptItem;
    expect(saved.tags).toEqual(['carreira']);
    expect(saved.variables).toEqual(['TEMA']);
    expect(saved.sharedDocs).toEqual(['https://docs.google.com/d/1']);
  });

  it('rejects prompt docs over the 50MB storage limit before uploading', async () => {
    const user = userEvent.setup();
    const onSavePromptDoc = vi.fn();
    renderModule({ onSavePromptDoc });
    await user.click(screen.getByLabelText('Documentos para teste'));

    const file = new File(['x'], 'grande.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 });
    const input = screen.getByRole('dialog').querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByRole('alert')).toHaveTextContent('O limite é 50MB.');
    expect(onSavePromptDoc).not.toHaveBeenCalled();
  });

  it('can still copy the original text of a prompt with variables', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderModule({ prompts: [makePrompt({ promptText: 'Explique [TEMA].', variables: ['TEMA'] })] });

    await user.click(screen.getByRole('button', { name: /Copiar/ }));
    await user.click(screen.getByRole('button', { name: 'Copiar original' }));
    expect(writeText).toHaveBeenCalledWith('Explique [TEMA].');
  });

  it('shows an error toast and does not count usage when the clipboard write fails', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const onSavePrompt = vi.fn().mockResolvedValue(undefined);
    renderModule({ prompts: [makePrompt()], onSavePrompt });

    await user.click(screen.getByRole('button', { name: /Copiar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível copiar o prompt.');
    expect(onSavePrompt).not.toHaveBeenCalled();
  });

  describe('form drafts', () => {
    it('keeps an unsaved new prompt when the form is closed and offers to discard it on reopen', async () => {
      const user = userEvent.setup();
      renderModule();
      await user.click(screen.getByLabelText('Novo prompt'));
      await user.type(screen.getByLabelText('Título do Prompt *'), 'Meu rascunho');
      await user.click(within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Fechar' })[0]!);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await user.click(screen.getByLabelText('Novo prompt'));
      expect(screen.getByLabelText('Título do Prompt *')).toHaveValue('Meu rascunho');
      expect(screen.getByText('Continuando o rascunho que você não salvou.')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Descartar rascunho' }));
      expect(screen.getByLabelText('Título do Prompt *')).toHaveValue('');
    });

    it('asks before throwing away unsaved edits, and closes freely when nothing changed', async () => {
      const user = userEvent.setup();
      const { onSavePrompt } = renderModule({ prompts: [makePrompt({ title: 'Prompt X' })] });

      await user.click(screen.getByLabelText('Mais ações para Prompt X'));
      await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
      await user.type(screen.getByLabelText('Título do Prompt *'), ' editado');
      await user.keyboard('{Escape}');
      expect(screen.getByText('Descartar as alterações não salvas?')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Continuar editando' }));
      expect(screen.getByLabelText('Título do Prompt *')).toHaveValue('Prompt X editado');

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      await user.click(screen.getByRole('button', { name: 'Descartar' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(onSavePrompt).not.toHaveBeenCalled();

      await user.click(screen.getByLabelText('Mais ações para Prompt X'));
      await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
      expect(screen.getByLabelText('Título do Prompt *')).toHaveValue('Prompt X');
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('sets a new-prompt draft aside while another prompt is edited', async () => {
      const user = userEvent.setup();
      renderModule({ prompts: [makePrompt({ title: 'Prompt X' })] });
      await user.click(screen.getByLabelText('Novo prompt'));
      await user.type(screen.getByLabelText('Título do Prompt *'), 'Rascunho guardado');
      await user.keyboard('{Escape}');

      await user.click(screen.getByLabelText('Mais ações para Prompt X'));
      await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
      expect(screen.getByLabelText('Título do Prompt *')).toHaveValue('Prompt X');
      expect(screen.queryByText('Continuando o rascunho que você não salvou.')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      await user.click(screen.getByLabelText('Novo prompt'));
      expect(screen.getByLabelText('Título do Prompt *')).toHaveValue('Rascunho guardado');
    });

    it('confirms an edit with a toast and saves confetti for new prompts only', async () => {
      const user = userEvent.setup();
      const confetti = (await import('canvas-confetti')).default as unknown as ReturnType<typeof vi.fn>;
      confetti.mockClear();
      renderModule({ prompts: [makePrompt({ title: 'Prompt X' })] });

      await user.click(screen.getByLabelText('Mais ações para Prompt X'));
      await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
      await user.type(screen.getByLabelText('Título do Prompt *'), '!');
      await user.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(await screen.findByText('Prompt atualizado')).toBeInTheDocument();
      expect(confetti).not.toHaveBeenCalled();
    });

    it('inserts variables at the cursor and offers placeholders found in the text', async () => {
      const user = userEvent.setup();
      renderModule();
      await user.click(screen.getByLabelText('Novo prompt'));
      const text = screen.getByLabelText('Texto do Prompt *');
      await user.type(text, 'Fale com [[PUBLICO] sobre ');

      await user.click(screen.getByRole('button', { name: 'Adicionar variável detectada PUBLICO' }));
      await user.type(screen.getByLabelText('Parâmetros do Prompt'), 'tema{Enter}');
      await user.click(screen.getByRole('button', { name: 'Inserir [TEMA] no texto' }));

      expect(text).toHaveValue('Fale com [PUBLICO] sobre [TEMA]');
      expect(screen.getByRole('button', { name: 'Inserir [PUBLICO] no texto' })).toBeInTheDocument();
      expect(screen.getByText('31/20.000')).toBeInTheDocument();
    });
  });

  describe('enhance', () => {
    const original = makePrompt({ id: 'p1', title: 'Prompt X', promptText: 'Texto original' });

    async function enhanceWith(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByLabelText('Mais ações para Prompt X'));
      await user.click(screen.getByRole('menuitem', { name: 'Aprimorar com IA' }));
      expect(enhancePromptMock).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'Mais conciso' }));
      await user.click(screen.getByRole('button', { name: 'Aprimorar' }));
    }

    beforeEach(() => {
      enhancePromptMock.mockResolvedValue({
        enhanced: 'Texto aprimorado',
        improvements: ['Persona definida'],
        tip: 'Teste com exemplos',
      });
    });

    it('waits for the user to pick goals, then compares the versions and explains the changes', async () => {
      const user = userEvent.setup();
      renderModule({ prompts: [original] });
      await enhanceWith(user);

      const { objective } = enhancePromptMock.mock.calls[0]![0] as { objective: string };
      expect(objective).toContain('mais curto');
      expect(objective).toContain('claro');
      expect(await screen.findByRole('tabpanel', { name: 'Prompt aprimorado' })).toHaveTextContent('Texto aprimorado');
      expect(screen.getByText('Persona definida')).toBeInTheDocument();
      expect(screen.getByText('Teste com exemplos')).toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: 'Original' }));
      expect(screen.getByRole('tabpanel', { name: 'Prompt original' })).toHaveTextContent('Texto original');
    });

    it('replaces the original prompt and can undo it from the toast', async () => {
      const user = userEvent.setup();
      const { onSavePrompt } = renderModule({ prompts: [original] });
      await enhanceWith(user);
      await user.click(await screen.findByRole('button', { name: 'Substituir original' }));

      await waitFor(() =>
        expect(onSavePrompt).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'p1', promptText: 'Texto aprimorado' }),
        ),
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Desfazer' }));
      expect(onSavePrompt).toHaveBeenLastCalledWith(original);
    });

    it('saves the improved version as a separate prompt', async () => {
      const user = userEvent.setup();
      const { onSavePrompt } = renderModule({ prompts: [{ ...original, usageCount: 7, isFavorite: true }] });
      await enhanceWith(user);
      await user.click(await screen.findByRole('button', { name: 'Salvar como novo' }));

      await waitFor(() => expect(onSavePrompt).toHaveBeenCalledTimes(1));
      const saved = vi.mocked(onSavePrompt).mock.calls[0]![0];
      expect(saved).toMatchObject({ title: 'Prompt X (aprimorado)', promptText: 'Texto aprimorado', usageCount: 0 });
      expect(saved.id).not.toBe('p1');
      expect(saved.isFavorite).toBe(false);
    });

    it('shows the error and lets the user retry when enhancing fails', async () => {
      const user = userEvent.setup();
      enhancePromptMock.mockRejectedValueOnce(new Error('Limite de uso atingido'));
      renderModule({ prompts: [original] });
      await enhanceWith(user);

      expect(await screen.findByRole('alert')).toHaveTextContent('Limite de uso atingido');
      await user.click(screen.getByRole('button', { name: 'Aprimorar' }));
      expect(await screen.findByRole('button', { name: 'Substituir original' })).toBeInTheDocument();
    });
  });

  describe('tester', () => {
    it('previews the filled prompt, warns about empty variables and renders the answer as Markdown', async () => {
      const user = userEvent.setup();
      sendChatMessageMock.mockResolvedValue('## Plano\n- **Dia 1**: estudar');
      renderModule({
        prompts: [makePrompt({ promptText: 'Plano sobre [TEMA] para [NIVEL].', variables: ['TEMA'] })],
      });
      await user.click(screen.getByRole('button', { name: 'Testar prompt com IA' }));
      expect(screen.getByText(/estão vazias e serão enviadas/)).toHaveTextContent('[TEMA], [NIVEL]');

      await user.type(screen.getByLabelText('[TEMA]'), 'IA');
      expect(screen.getByLabelText('Prompt que será enviado')).toHaveTextContent('Plano sobre IA para [NIVEL].');
      expect(screen.getByText(/está vazia e será enviada/)).toHaveTextContent('[NIVEL]');

      await user.click(screen.getByRole('button', { name: 'Executar' }));
      expect(sendChatMessageMock).toHaveBeenCalledWith('Plano sobre IA para [NIVEL].', undefined, undefined);
      expect(await screen.findByText('Dia 1')).toContainHTML('strong');
      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('runs again from the footer and keeps earlier answers in a history', async () => {
      const user = userEvent.setup();
      sendChatMessageMock.mockResolvedValueOnce('Primeira resposta').mockResolvedValueOnce('Segunda resposta');
      renderModule({ prompts: [makePrompt({ promptText: 'Sem variáveis' })] });
      await user.click(screen.getByRole('button', { name: 'Testar prompt com IA' }));

      await user.click(screen.getByRole('button', { name: 'Executar' }));
      await screen.findByText('Primeira resposta');
      await user.click(screen.getByRole('button', { name: 'Executar novamente' }));

      expect(await screen.findByText('Segunda resposta')).toBeInTheDocument();
      expect(screen.getByText('Execuções anteriores (1)')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Testar prompt com IA' }));
      expect(screen.getByText('Segunda resposta')).toBeInTheDocument();
    });

    it('attaches a document from the library, skipping files over the 4MB test limit', async () => {
      const user = userEvent.setup();
      sendChatMessageMock.mockResolvedValue('ok');
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['pdf']) });
      vi.stubGlobal('fetch', fetchMock);
      const doc = {
        id: 'd1',
        name: 'guia.pdf',
        filePath: 'u/d1-guia.pdf',
        fileData: 'https://signed.example/guia.pdf',
        fileType: 'application/pdf',
        fileSize: 1000,
        createdAt: '2026-11-01T00:00:00.000Z',
      };
      renderModule({
        prompts: [makePrompt({ promptText: 'Resuma o anexo' })],
        promptDocs: [doc, { ...doc, id: 'd2', name: 'enorme.pdf', fileSize: 10 * 1024 * 1024 }],
      });
      await user.click(screen.getByRole('button', { name: 'Testar prompt com IA' }));
      await user.click(screen.getByRole('button', { name: 'Anexar da biblioteca (2)' }));

      expect(screen.getByRole('button', { name: /enorme\.pdf/ })).toBeDisabled();
      await user.click(screen.getByRole('button', { name: /guia\.pdf/ }));
      expect(await screen.findByText('Anexo pronto para o teste')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith('https://signed.example/guia.pdf');

      await user.click(screen.getByRole('button', { name: 'Executar' }));
      expect(sendChatMessageMock).toHaveBeenCalledWith(
        'Resuma o anexo',
        undefined,
        expect.objectContaining({ fileName: 'guia.pdf', mimeType: 'application/pdf' }),
      );
      vi.unstubAllGlobals();
    });
  });

  describe('library tools', () => {
    it('opens the export dialog directly with only the filtered prompts pre-selected', async () => {
      const user = userEvent.setup();
      renderModule({
        prompts: [
          makePrompt({ id: 'p1', title: 'Prompt A', section: 'Estudos' }),
          makePrompt({ id: 'p2', title: 'Prompt B', section: 'Carreira' }),
        ],
      });
      await user.click(screen.getByRole('button', { name: 'Estudos' }));
      await user.click(screen.getByRole('button', { name: 'Exportar prompts em PDF' }));

      const dialog = screen.getByRole('dialog', { name: 'Selecionar prompts para exportar' });
      expect(within(dialog).getByRole('checkbox', { name: /Prompt A/ })).toBeChecked();
      expect(within(dialog).getByRole('checkbox', { name: /Prompt B/ })).not.toBeChecked();

      await user.type(within(dialog).getByLabelText('Buscar prompts para exportar'), 'prompt b');
      expect(within(dialog).queryByRole('checkbox', { name: /Prompt A/ })).not.toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: 'Selecionar resultados' }));
      expect(within(dialog).getByText('2 de 2 selecionados')).toBeInTheDocument();
    });

    it('deletes a library document with an undo toast instead of a browser confirm', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm');
      const onDeletePromptDoc = vi.fn().mockResolvedValue(undefined);
      renderModule({
        onDeletePromptDoc,
        promptDocs: [
          { id: 'd1', name: 'guia.pdf', filePath: '', fileType: 'application/pdf', createdAt: '2026-11-01' },
        ],
      });
      await user.click(screen.getByLabelText('Documentos para teste'));
      await user.click(screen.getByLabelText('Excluir guia.pdf'));

      expect(screen.queryByText('guia.pdf')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Desfazer' }));
      expect(screen.getByText('guia.pdf')).toBeInTheDocument();
      expect(onDeletePromptDoc).not.toHaveBeenCalled();
      expect(confirmSpy).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('duplicates a prompt and offers to edit the copy', async () => {
      const user = userEvent.setup();
      const { onSavePrompt } = renderModule({
        prompts: [makePrompt({ id: 'p1', title: 'Prompt X', usageCount: 5, isFavorite: true })],
      });
      await user.click(screen.getByLabelText('Mais ações para Prompt X'));
      await user.click(screen.getByRole('menuitem', { name: 'Duplicar' }));

      await waitFor(() => expect(onSavePrompt).toHaveBeenCalledTimes(1));
      const copy = vi.mocked(onSavePrompt).mock.calls[0]![0];
      expect(copy).toMatchObject({ title: 'Prompt X (cópia)', usageCount: 0, isFavorite: false });
      expect(copy.id).not.toBe('p1');

      await user.click(await screen.findByRole('button', { name: 'Editar' }));
      expect(screen.getByLabelText('Título do Prompt *')).toHaveValue('Prompt X (cópia)');
    });
  });

  describe('search, filters and sorting', () => {
    it('ignores accents, matches the category and shows how many prompts match', async () => {
      const user = userEvent.setup();
      renderModule({
        prompts: [
          makePrompt({ id: 'p1', title: 'Programação em Python', section: 'Estudos' }),
          makePrompt({ id: 'p2', title: 'Roteiro', promptText: 'evento', tags: [], section: 'Eventos' }),
        ],
      });
      await user.type(screen.getByLabelText('Buscar prompts'), 'programacao');
      expect(screen.getByText('Programação em Python')).toBeInTheDocument();
      expect(screen.queryByText('Roteiro')).not.toBeInTheDocument();
      expect(screen.getByText('1 de 2 prompts')).toBeInTheDocument();

      await user.clear(screen.getByLabelText('Buscar prompts'));
      await user.type(screen.getByLabelText('Buscar prompts'), 'eventos');
      expect(screen.getByText('Roteiro')).toBeInTheDocument();
    });

    it('keeps the filters in the URL and restores them from it', async () => {
      const user = userEvent.setup();
      renderModule(
        {
          prompts: [
            makePrompt({ id: 'p1', title: 'Prompt A', section: 'Estudos', isFavorite: true }),
            makePrompt({ id: 'p2', title: 'Prompt B', section: 'Carreira' }),
          ],
        },
        { initialUrl: '/prompts?secao=Carreira' },
      );
      expect(screen.getByText('Prompt B')).toBeInTheDocument();
      expect(screen.queryByText('Prompt A')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Todos' }));
      await user.click(screen.getByRole('button', { name: 'Favoritos' }));
      await user.type(screen.getByLabelText('Buscar prompts'), 'a');
      expect(currentSearch().get('fav')).toBe('1');
      expect(currentSearch().get('q')).toBe('a');
      expect(currentSearch().has('secao')).toBe(false);
    });

    it('focuses the search box when "/" is pressed outside a text field', async () => {
      const user = userEvent.setup();
      renderModule({ prompts: [makePrompt()] });
      await user.keyboard('/');
      expect(screen.getByLabelText('Buscar prompts')).toHaveFocus();
      expect(screen.getByLabelText('Buscar prompts')).toHaveValue('');
    });

    it('sorts prompts by the chosen option', async () => {
      const user = userEvent.setup();
      renderModule({
        prompts: [
          makePrompt({ id: 'p1', title: 'Pouco usado', usageCount: 1, createdAt: '2026-11-10T00:00:00.000Z' }),
          makePrompt({ id: 'p2', title: 'Muito usado', usageCount: 9, createdAt: '2026-01-10T00:00:00.000Z' }),
        ],
      });
      const titles = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
      expect(titles()).toEqual(['Pouco usado', 'Muito usado']);

      await user.click(screen.getByLabelText('Ordenar prompts'));
      await user.click(screen.getByRole('option', { name: 'Mais usados' }));
      expect(titles()).toEqual(['Muito usado', 'Pouco usado']);
    });
  });

  describe('card', () => {
    it('updates the favorite star right away, before the save finishes', async () => {
      const user = userEvent.setup();
      renderModule({
        prompts: [makePrompt({ isFavorite: false })],
        onSavePrompt: vi.fn(() => new Promise<void>(() => {})),
      });
      await user.click(screen.getByRole('button', { name: 'Adicionar aos favoritos' }));
      expect(screen.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('expands long prompt text and leaves short text alone', async () => {
      const user = userEvent.setup();
      renderModule({
        prompts: [
          makePrompt({ id: 'p1', title: 'Longo', promptText: 'x'.repeat(400) }),
          makePrompt({ id: 'p2', title: 'Curto', promptText: 'Curto e direto' }),
        ],
      });
      const toggle = screen.getByRole('button', { name: 'Ver mais' });
      expect(within(document.getElementById('prompt-card-p2')!).queryByRole('button', { name: 'Ver mais' })).toBeNull();
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(toggle).toHaveTextContent('Ver menos');
    });

    it('hides the usage count until a prompt is used, then shows when it was last used', () => {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString();
      renderModule({
        prompts: [
          makePrompt({ id: 'p1', usageCount: 0 }),
          makePrompt({ id: 'p2', usageCount: 3, lastUsed: yesterday }),
        ],
      });
      expect(within(document.getElementById('prompt-card-p1')!).queryByText(/Usado/)).toBeNull();
      expect(within(document.getElementById('prompt-card-p2')!).getByText('Usado 3x · ontem')).toBeInTheDocument();
    });
  });
});
