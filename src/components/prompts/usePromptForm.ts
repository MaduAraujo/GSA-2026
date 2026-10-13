import { usePersistedState } from '../../hooks/usePersistedState';
import type { PromptItem } from '../../types';

export const DEFAULT_PROMPT_FORM: Partial<PromptItem> = {
  title: '',
  promptText: '',
  section: '',
  tags: [],
  variables: [],
  sharedDocs: [],
  isFavorite: false,
  usageCount: 0,
};

export function usePromptForm() {
  const [isOpen, setIsOpen] = usePersistedState('gsa_prompt_modal_open', false);
  const [isEditMode, setIsEditMode] = usePersistedState('gsa_prompt_edit_mode', false);
  const [formData, setFormData] = usePersistedState<Partial<PromptItem>>('gsa_prompt_form_draft', DEFAULT_PROMPT_FORM);
  const [tagInput, setTagInput] = usePersistedState('gsa_prompt_tag_draft', '');
  const [varInput, setVarInput] = usePersistedState('gsa_prompt_var_draft', '');
  const [docInput, setDocInput] = usePersistedState('gsa_prompt_doc_draft', '');

  const clearInputs = () => {
    setTagInput('');
    setVarInput('');
    setDocInput('');
  };

  const reset = () => {
    setFormData(DEFAULT_PROMPT_FORM);
    clearInputs();
    setIsEditMode(false);
  };

  return {
    isOpen,
    isEditMode,
    formData,
    setFormData,
    tagInput,
    setTagInput,
    varInput,
    setVarInput,
    docInput,
    setDocInput,
    reset,
    close: () => setIsOpen(false),
    openCreate: () => {
      reset();
      setIsOpen(true);
    },
    openEdit: (prompt: PromptItem) => {
      setFormData({ ...prompt });
      clearInputs();
      setIsEditMode(true);
      setIsOpen(true);
    },
  };
}

export type PromptFormState = ReturnType<typeof usePromptForm>;
