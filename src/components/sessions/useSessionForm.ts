import { useEffect, useState } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import type { AmbassadorSession, SessionType } from '../../types';
import { todayISO } from '../../utils/date';

export const DEFAULT_SESSION_FORM: Partial<AmbassadorSession> = {
  title: '',
  date: '',
  challenge: '',
  challengeFiles: [],
  toolLearned: '',
  proofImage: '',
  proofMediaType: 'image',
  score: undefined,
  durationMinutes: undefined,
  notes: '',
};

const blankForm = (type: SessionType, extra: Partial<AmbassadorSession> = {}): Partial<AmbassadorSession> => ({
  ...DEFAULT_SESSION_FORM,
  date: todayISO(),
  type,
  ...extra,
});

export function hasDraftContent(form: Partial<AmbassadorSession>): boolean {
  return (
    !form.id &&
    !!(
      form.title?.trim() ||
      form.challenge?.trim() ||
      form.toolLearned?.trim() ||
      form.notes?.trim() ||
      form.challengeFiles?.length ||
      form.proofImage ||
      form.score ||
      form.durationMinutes
    )
  );
}

export function useSessionForm() {
  const [isOpen, setIsOpen] = usePersistedState('gsa_sessions_modal_open', false);
  const [formData, setFormData] = usePersistedState<Partial<AmbassadorSession>>(
    'gsa_sessions_form_draft',
    DEFAULT_SESSION_FORM,
  );
  const [baseline, setBaseline] = usePersistedState('gsa_sessions_form_baseline', '');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  const setVideo = (file: File | null) => {
    setVideoFile(file);
    setVideoPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const start = (data: Partial<AmbassadorSession>, snapshot = data) => {
    setFormData(data);
    setBaseline(JSON.stringify(snapshot));
    setVideo(null);
    setIsOpen(true);
  };

  const isDirty = !!videoFile || JSON.stringify(formData) !== baseline;

  return {
    isOpen,
    formData,
    setFormData,
    videoFile,
    videoPreviewUrl,
    setVideo,
    isDirty,
    isEditing: !!formData.id,
    hasDraft: !isOpen && hasDraftContent(formData),
    close: () => setIsOpen(false),
    reopen: () => setIsOpen(true),
    reset: () => {
      setFormData(DEFAULT_SESSION_FORM);
      setBaseline('');
      setVideo(null);
    },
    openCreate: (type: SessionType = 'Sessão'): boolean => {
      if (hasDraftContent(formData)) {
        setIsOpen(true);
        return true;
      }
      start(blankForm(type));
      return false;
    },
    openPrefilled: (prefill: Partial<AmbassadorSession>) => {
      const type = prefill.type ?? 'Sessão';
      start(blankForm(type, prefill), blankForm(type));
    },
    openEdit: (session: AmbassadorSession) => start(session),
  };
}

export type SessionFormState = ReturnType<typeof useSessionForm>;
