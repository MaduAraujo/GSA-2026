import { useEffect, useState } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import type { Challenge } from '../../types';

export const DEFAULT_CHALLENGE_FORM: Partial<Challenge> = {
  title: '',
  description: '',
  category: '',
  status: undefined,
  dates: [],
  link: '',
  points: undefined,
  result: '',
  resultImage: '',
  resultMediaType: 'image',
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
    isEditMode,
    formData,
    setFormData,
    videoFile,
    videoPreviewUrl,
    setVideo,
    close: () => setIsOpen(false),
    reset: () => {
      setFormData(DEFAULT_CHALLENGE_FORM);
      setIsEditMode(false);
      setVideo(null);
    },
    openCreate: () => {
      setFormData(DEFAULT_CHALLENGE_FORM);
      setIsEditMode(false);
      setVideo(null);
      setIsOpen(true);
    },
    openEdit: (challenge: Challenge) => {
      setFormData({ ...challenge, dates: challenge.dates || (challenge.deadline ? [challenge.deadline] : []) });
      setIsEditMode(true);
      setVideo(null);
      setIsOpen(true);
    },
  };
}

export type ChallengeFormState = ReturnType<typeof useChallengeForm>;
