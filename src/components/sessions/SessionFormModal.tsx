import { FileText, GraduationCap, Loader2, Paperclip, Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { AmbassadorSession, SessionFile } from '../../types';
import { DatePicker } from '../DatePicker';
import { NumberStepper } from '../NumberStepper';
import {
  formatFileSize,
  isImageFile,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_PROOF_VIDEO_SIZE_BYTES,
} from './sessionFiles';
import type { SessionFormState } from './useSessionForm';

interface SessionFormModalProps {
  form: SessionFormState;
  onSaveSession: (session: AmbassadorSession, proofVideoFile?: File) => Promise<void>;
}

const labelClass = 'block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1';
const toMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

export function SessionFormModal({ form, onSaveSession }: SessionFormModalProps) {
  const { formData, setFormData, videoFile, videoPreviewUrl } = form;
  const [proofError, setProofError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, form.close);

  const loadProof = (file: File) => {
    setProofError(null);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setProofError('Envie um arquivo de imagem (PNG, JPG, WebP) ou vídeo.');
      return;
    }
    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
      setProofError(`Imagem muito grande (${toMb(file.size)}MB). O limite é 4MB.`);
      return;
    }
    if (isVideo && file.size > MAX_PROOF_VIDEO_SIZE_BYTES) {
      setProofError(`Vídeo muito grande (${toMb(file.size)}MB). O limite é 50MB.`);
      return;
    }

    if (isVideo) {
      form.setVideo(file);
      setFormData((prev) => ({ ...prev, proofImage: '', proofMediaType: 'video' }));
      return;
    }

    form.setVideo(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, proofImage: event.target?.result as string, proofMediaType: 'image' }));
    };
    reader.readAsDataURL(file);
  };

  const loadAttachments = (files: FileList | File[]) => {
    setAttachmentError(null);
    Array.from(files).forEach((file) => {
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        setAttachmentError(`"${file.name}" é muito grande (${toMb(file.size)}MB). O limite é 8MB por arquivo.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const newFile: SessionFile = {
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl: event.target?.result as string,
          fileType: file.type,
          fileSize: file.size,
        };
        setFormData((prev) => ({ ...prev, challengeFiles: [...(prev.challengeFiles || []), newFile] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleProofChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadProof(file);
    e.target.value = '';
  };

  const handleProofDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadProof(file);
  };

  const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) loadAttachments(e.target.files);
    e.target.value = '';
  };

  const handleAttachmentDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) loadAttachments(e.dataTransfer.files);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.date) return;

    setIsSaving(true);
    try {
      await onSaveSession(
        {
          id: formData.id || crypto.randomUUID(),
          title: formData.title.trim(),
          date: formData.date,
          challenge: (formData.challenge || '').trim() || undefined,
          challengeFiles:
            formData.challengeFiles && formData.challengeFiles.length > 0 ? formData.challengeFiles : undefined,
          toolLearned: (formData.toolLearned || '').trim(),
          proofImage: formData.proofImage || undefined,
          proofMediaType: videoFile ? 'video' : formData.proofMediaType || 'image',
          score: formData.score,
          createdAt: formData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        videoFile || undefined,
      );
      form.close();
      form.reset();
    } catch (err) {
      console.error(err);
      alert('Não foi possível salvar a sessão. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const proofVideoSrc = videoPreviewUrl ?? (formData.proofMediaType === 'video' ? formData.proofImage : undefined);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-form-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col"
      >
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#34A853]/10 text-[#34A853] flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 id="session-form-heading" className="text-lg sm:text-xl font-bold text-gray-900">
                  {formData.id ? 'Editar Sessão' : 'Nova Sessão'}
                </h3>
                <p className="text-xs text-gray-500">Registre o que você fez e aprendeu</p>
              </div>
            </div>
            <button
              onClick={form.close}
              aria-label="Fechar"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="session-form-title" className={labelClass}>
                Sessão *
              </label>
              <input
                id="session-form-title"
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#34A853]/30"
              />
            </div>

            <div>
              <label htmlFor="session-form-date" className={labelClass}>
                Dia *
              </label>
              <DatePicker
                id="session-form-date"
                value={formData.date || ''}
                onChange={(date) => setFormData({ ...formData, date })}
                placeholder="Selecione"
              />
            </div>

            <div>
              <label htmlFor="session-form-challenge" className={labelClass}>
                Desafio proposto (se tiver)
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleAttachmentDrop}
                className="flex items-center gap-2"
              >
                <input
                  id="session-form-challenge"
                  type="text"
                  value={formData.challenge || ''}
                  onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  aria-label="Anexar arquivo do desafio (pode selecionar vários)"
                  title="Anexar arquivo do desafio (pode selecionar vários)"
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:text-[#34A853] hover:border-[#34A853] transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentChange}
                />
              </div>

              {attachmentError && (
                <p
                  role="alert"
                  className="mt-2 text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5"
                >
                  {attachmentError}
                </p>
              )}

              {formData.challengeFiles && formData.challengeFiles.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {formData.challengeFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
                    >
                      {isImageFile(file) ? (
                        <img src={file.dataUrl} alt={file.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-[#34A853] shrink-0" />
                      )}
                      <span className="text-xs font-medium text-gray-700 truncate flex-1">{file.name}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{formatFileSize(file.fileSize)}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            challengeFiles: (prev.challengeFiles || []).filter((f) => f.id !== file.id),
                          }))
                        }
                        aria-label="Remover arquivo"
                        className="p-1 rounded-lg text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="session-form-tool" className={labelClass}>
                  Ferramenta que aprendeu
                </label>
                <input
                  id="session-form-tool"
                  type="text"
                  value={formData.toolLearned || ''}
                  onChange={(e) => setFormData({ ...formData, toolLearned: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                />
              </div>

              <div>
                <label htmlFor="session-form-score" className={labelClass}>
                  Pontuação
                </label>
                <NumberStepper
                  id="session-form-score"
                  min={0}
                  value={formData.score ?? 0}
                  onChange={(score) => setFormData({ ...formData, score })}
                />
              </div>
            </div>

            <div>
              <span className={labelClass}>Foto ou vídeo de comprovação</span>
              <div
                role="button"
                tabIndex={0}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleProofDrop}
                onClick={() => proofInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    proofInputRef.current?.click();
                  }
                }}
                aria-label="Anexar foto ou vídeo de comprovação"
                className="w-full border-2 border-dashed border-gray-300 hover:border-[#34A853] bg-[#F8FAFD] rounded-2xl p-6 text-center cursor-pointer transition-all space-y-3"
              >
                {proofVideoSrc ? (
                  <div className="flex items-center justify-center gap-4">
                    <video src={proofVideoSrc} className="h-24 max-w-xs rounded-lg shadow-xs" muted controls />
                    <p className="text-xs text-green-600 font-medium">Vídeo carregado com sucesso!</p>
                  </div>
                ) : formData.proofImage ? (
                  <div className="flex items-center justify-center gap-4">
                    <img
                      src={formData.proofImage}
                      alt="Prévia"
                      className="h-24 max-w-xs object-contain rounded-lg shadow-xs"
                    />
                    <p className="text-xs text-green-600 font-medium">Foto carregada com sucesso!</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#34A853]/10 text-[#34A853] flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">Arraste ou clique para anexar</p>
                    <p className="text-[11px] text-gray-400">Imagem até 4MB ou vídeo até 50MB</p>
                  </>
                )}
              </div>
              <input
                ref={proofInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleProofChange}
              />

              {proofError && (
                <p
                  role="alert"
                  className="mt-2 text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5"
                >
                  {proofError}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={form.close}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || !formData.title?.trim() || !formData.date}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#34A853] hover:bg-[#1E8E3E] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? (videoFile ? 'Enviando vídeo...' : 'Salvando...') : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
