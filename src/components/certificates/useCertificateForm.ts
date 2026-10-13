import { useState } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import type { Certificate } from '../../types';

export type CertificateFileType = NonNullable<Certificate['fileType']>;

const today = () => new Date().toISOString().split('T')[0];

export const DEFAULT_CERT_FORM: Partial<Certificate> = {
  title: '',
  issuer: '',
  issueDate: today(),
  category: '',
  description: '',
  skills: [],
  credentialId: '',
  credentialUrl: '',
  hours: 0,
  minutes: 0,
  isFavorite: false,
};

export function useCertificateForm() {
  const [isOpen, setIsOpen] = usePersistedState('gsa_cert_modal_open', false);
  const [isEditMode, setIsEditMode] = usePersistedState('gsa_cert_edit_mode', false);
  const [formData, setFormData] = usePersistedState<Partial<Certificate>>('gsa_cert_form_draft', DEFAULT_CERT_FORM);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<CertificateFileType>('image');
  const [fileError, setFileError] = useState<string | null>(null);

  const reset = () => {
    setFormData({ ...DEFAULT_CERT_FORM, issueDate: today() });
    setFilePreview(null);
    setFileName('');
    setFileError(null);
    setIsEditMode(false);
  };

  return {
    isOpen,
    isEditMode,
    formData,
    setFormData,
    filePreview,
    setFilePreview,
    fileName,
    setFileName,
    fileType,
    setFileType,
    fileError,
    setFileError,
    reset,
    close: () => setIsOpen(false),
    openCreate: () => {
      reset();
      setIsOpen(true);
    },
    openEdit: (cert: Certificate) => {
      setFormData({ ...cert });
      setFilePreview(cert.fileData || null);
      setFileName(cert.fileName || '');
      setFileType(cert.fileType || 'image');
      setFileError(null);
      setIsEditMode(true);
      setIsOpen(true);
    },
  };
}

export type CertificateFormState = ReturnType<typeof useCertificateForm>;
