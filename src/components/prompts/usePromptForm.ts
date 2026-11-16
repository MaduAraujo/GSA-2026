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

const EDITABLE_FIELDS = [
  'title',
  'promptText',
  'section',
  'tags',
  'variables',
  'sharedDocs',
  'recommendedModel',
] as const;

function sameFields(a: Partial<PromptItem>, b: Partial<PromptItem>): boolean {
  return EDITABLE_FIELDS.every((field) => JSON.stringify(a[field] ?? null) === JSON.stringify(b[field] ?? null));
}

interface CreateDraft {
  formData: Partial<PromptItem>;
  tagInput: string;
  varInput: string;
  docInput: string;
}

export function usePromptForm() {
  const [isOpen, setIsOpen] = usePersistedState('gsa_prompt_modal_open', false);
  const [isEditMode, setIsEditMode] = usePersistedState('gsa_prompt_edit_mode', false);
  const [formData, setFormData] = usePersistedState<Partial<PromptItem>>('gsa_prompt_form_draft', DEFAULT_PROMPT_FORM);
  const [baseline, setBaseline] = usePersistedState<Partial<PromptItem>>(
    'gsa_prompt_form_baseline',
    DEFAULT_PROMPT_FORM,
  );
  const [stashedDraft, setStashedDraft] = usePersistedState<CreateDraft | null>('gsa_prompt_create_stash', null);
  const [tagInput, setTagInput] = usePersistedState('gsa_prompt_tag_draft', '');
  const [varInput, setVarInput] = usePersistedState('gsa_prompt_var_draft', '');
  const [docInput, setDocInput] = usePersistedState('gsa_prompt_doc_draft', '');

  const isDirty = !sameFields(formData, baseline) || !!(tagInput.trim() || varInput.trim() || docInput.trim());
  const hasCreateDraft = isEditMode ? stashedDraft !== null : isDirty;

  const load = (draft: CreateDraft) => {
    setFormData(draft.formData);
    setTagInput(draft.tagInput);
    setVarInput(draft.varInput);
    setDocInput(draft.docInput);
  };

  const reset = () => {
    load({ formData: DEFAULT_PROMPT_FORM, tagInput: '', varInput: '', docInput: '' });
    setBaseline(DEFAULT_PROMPT_FORM);
    setIsEditMode(false);
  };

  const leaveForm = () => {
    reset();
    if (isEditMode && stashedDraft) load(stashedDraft);
    setStashedDraft(null);
  };

  return {
    isOpen,
    isEditMode,
    isDirty,
    hasCreateDraft,
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
    discard: () => {
      setIsOpen(false);
      leaveForm();
    },
    finishSave: () => {
      setIsOpen(false);
      leaveForm();
    },
    openCreate: () => {
      if (isEditMode) leaveForm();
      setIsOpen(true);
    },
    openEdit: (prompt: PromptItem) => {
      if (!isEditMode && isDirty) setStashedDraft({ formData, tagInput, varInput, docInput });
      load({ formData: { ...prompt }, tagInput: '', varInput: '', docInput: '' });
      setBaseline({ ...prompt });
      setIsEditMode(true);
      setIsOpen(true);
    },
  };
}

export type PromptFormState = ReturnType<typeof usePromptForm>;
