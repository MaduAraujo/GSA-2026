import { useEffect, useState } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import type { AmbassadorSession } from '../../types';

export const DEFAULT_SESSION_FORM: Partial<AmbassadorSession> = {
  title: '',
  date: '',
  challenge: '',
  challengeFiles: [],
  toolLearned: '',
  proofImage: '',
  proofMediaType: 'image',
  score: undefined,
};

export function useSessionForm() {
  const [isOpen, setIsOpen] = usePersistedState('gsa_sessions_modal_open', false);
  const [formData, setFormData] = usePersistedState<Partial<AmbassadorSession>>(
    'gsa_sessions_form_draft',
    DEFAULT_SESSION_FORM,
  );
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

  return {
    isOpen,
    formData,
    setFormData,
    videoFile,
    videoPreviewUrl,
    setVideo,
    close: () => setIsOpen(false),
    reset: () => {
      setFormData(DEFAULT_SESSION_FORM);
      setVideo(null);
    },
    openCreate: () => {
      setFormData(DEFAULT_SESSION_FORM);
      setVideo(null);
      setIsOpen(true);
    },
    openEdit: (session: AmbassadorSession) => {
      setFormData(session);
      setVideo(null);
      setIsOpen(true);
    },
  };
}

export type SessionFormState = ReturnType<typeof useSessionForm>;
