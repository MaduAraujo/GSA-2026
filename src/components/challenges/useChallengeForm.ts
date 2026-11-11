import { useEffect, useRef, useState } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import type { Challenge, ChallengeMedia, ChallengeMediaKind, ChallengeType } from '../../types';

export const DEFAULT_CHALLENGE_FORM: Partial<Challenge> = {
  title: '',
  description: '',
  category: '',
  status: undefined,
  dates: [],
  link: '',
  points: undefined,
  result: '',
  media: [],
  socialLinks: [],
  externalLink: '',
};

export function useChallengeForm() {
  const [isOpen, setIsOpen] = usePersistedState('gsa_challenge_modal_open', false);
  const [isEditMode, setIsEditMode] = usePersistedState('gsa_challenge_edit_mode', false);
  const [formData, setFormData] = usePersistedState<Partial<Challenge>>(
    'gsa_challenge_form_draft',
    DEFAULT_CHALLENGE_FORM,
  );
  const [mediaFiles, setMediaFiles] = useState<Record<string, File>>({});
  const previewUrls = useRef(new Set<string>());

  useEffect(() => {
    // Prévias blob: de um rascunho salvo não sobrevivem a um recarregamento da página.
    setFormData((prev) => ({ ...prev, media: (prev.media || []).filter((m) => !m.url.startsWith('blob:')) }));
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFiles = () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
    setMediaFiles({});
  };

  const addMediaFile = (file: File, kind: ChallengeMediaKind) => {
    const url = URL.createObjectURL(file);
    previewUrls.current.add(url);
    const item: ChallengeMedia = {
      id: crypto.randomUUID(),
      name: file.name,
      kind,
      url,
      mimeType: file.type,
      fileSize: file.size,
    };
    setMediaFiles((prev) => ({ ...prev, [item.id]: file }));
    setFormData((prev) => ({ ...prev, media: [...(prev.media || []), item] }));
  };

  const removeMedia = (id: string) => {
    setFormData((prev) => {
      const removed = (prev.media || []).find((m) => m.id === id);
      if (removed && previewUrls.current.delete(removed.url)) URL.revokeObjectURL(removed.url);
      return { ...prev, media: (prev.media || []).filter((m) => m.id !== id) };
    });
    setMediaFiles(({ [id]: _removed, ...rest }) => rest);
  };

  return {
    isOpen,
    isEditMode,
    formData,
    setFormData,
    mediaFiles,
    addMediaFile,
    removeMedia,
    close: () => setIsOpen(false),
    reset: () => {
      setFormData(DEFAULT_CHALLENGE_FORM);
      setIsEditMode(false);
      clearFiles();
    },
    openCreate: (type: ChallengeType = 'Desafio') => {
      setFormData({ ...DEFAULT_CHALLENGE_FORM, type });
      setIsEditMode(false);
      clearFiles();
      setIsOpen(true);
    },
    openEdit: (challenge: Challenge) => {
      setFormData({
        ...challenge,
        dates: challenge.dates || (challenge.deadline ? [challenge.deadline] : []),
        media: challenge.media || [],
      });
      setIsEditMode(true);
      clearFiles();
      setIsOpen(true);
    },
  };
}

export type ChallengeFormState = ReturnType<typeof useChallengeForm>;
