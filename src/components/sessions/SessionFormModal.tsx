import { FileText, GraduationCap, History, Loader2, Paperclip, Upload, X } from 'lucide-react';
import { useToast } from '../../app/ToastProvider';
import { buttonClasses } from '../ui/buttonClasses';
import { Modal, ModalHeader } from '../ui/Modal';
import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import type { AmbassadorSession, SessionFile } from '../../types';
import { DatePicker } from '../DatePicker';
import { NumberStepper } from '../NumberStepper';
import { PAST_SESSIONS } from '../pastSessions';
import { SelectDropdown } from '../SelectDropdown';
import {
  formatFileSize,
  isImageFile,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_PROOF_VIDEO_SIZE_BYTES,
} from './sessionFiles';
import { SESSION_TYPES, sessionTypeLabels, sessionTypeOf } from './sessionTypes';
import { findPastSession, pastSessionTitle } from './sessionView';
import { ToolsInput } from './ToolsInput';
import type { SessionFormState } from './useSessionForm';

interface SessionFormModalProps {
  form: SessionFormState;
  onSaveSession: (session: AmbassadorSession, proofVideoFile?: File) => Promise<void>;
  onClose: () => void;
  toolSuggestions: string[];
}

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const sectionTitleClass = 'text-2xs font-semibold text-gray-400';
const toMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

export function SessionFormModal({ form, onSaveSession, onClose, toolSuggestions }: SessionFormModalProps) {
  const toast = useToast();
  const { formData, setFormData, videoFile, videoPreviewUrl } = form;
  const labels = sessionTypeLabels(formData);
  const [proofError, setProofError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

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
    const all = Array.from(files);
    const tooBig = all.filter((file) => file.size > MAX_ATTACHMENT_SIZE_BYTES);
    const [first] = tooBig;
    setAttachmentError(
      !first
        ? null
        : tooBig.length === 1
          ? `"${first.name}" é muito grande (${toMb(first.size)}MB). O limite é 8MB por arquivo.`
          : `${tooBig.length} arquivos passam do limite de 8MB e não foram anexados: ${tooBig.map((f) => `"${f.name}"`).join(', ')}.`,
    );
    all.forEach((file) => {
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) return;
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
          type: sessionTypeOf(formData),
          title: formData.title.trim(),
          date: formData.date,
          challenge: (formData.challenge || '').trim() || undefined,
          challengeFiles:
            formData.challengeFiles && formData.challengeFiles.length > 0 ? formData.challengeFiles : undefined,
          toolLearned: (formData.toolLearned || '').trim(),
          proofImage: formData.proofImage || undefined,
          proofMediaType: videoFile ? 'video' : formData.proofMediaType || 'image',
          score: formData.score,
          durationMinutes: formData.durationMinutes,
          notes: (formData.notes || '').trim() || undefined,
          pastSessionId: formData.pastSessionId,
          createdAt: formData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        videoFile || undefined,
      );
      form.close();
      form.reset();
    } catch (err) {
      console.error(err);
      toast.show({ message: `Não foi possível salvar a ${labels.noun}. Tente novamente.`, tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const linkedPast = findPastSession(formData.pastSessionId);
  const proofVideoSrc = videoPreviewUrl ?? (formData.proofMediaType === 'video' ? formData.proofImage : undefined);

  return (
    <Modal onClose={onClose} labelledBy="session-form-heading">
      <ModalHeader
        titleId="session-form-heading"
        title={formData.id ? labels.editLabel : labels.newLabel}
        subtitle="Registre o que você fez e aprendeu"
        icon={GraduationCap}
        iconClassName="bg-primary/10 text-primary"
        onClose={onClose}
      />
      <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h4 className={sectionTitleClass}>Essencial</h4>

          {linkedPast && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-gray-700">
              <History aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1 min-w-0">
                Encontro oficial do Acervo: <strong className="font-semibold">{pastSessionTitle(linkedPast)}</strong>
              </span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, pastSessionId: undefined })}
                aria-label="Desvincular do encontro oficial"
                title="Desvincular"
                className="p-1 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div>
            <span className={labelClass}>Tipo *</span>
            <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-3 gap-2">
              {SESSION_TYPES.map(({ type }) => {
                const selected = sessionTypeOf(formData) === type;
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setFormData({ ...formData, type })}
                    className={`px-2 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selected
                        ? 'bg-success border-success text-white shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="session-form-title" className={labelClass}>
              Título *
            </label>
            <input
              id="session-form-title"
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus-visible:ring-2 focus-visible:ring-success/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label htmlFor="session-form-duration" className={labelClass}>
                Duração (min)
              </label>
              <NumberStepper
                id="session-form-duration"
                min={0}
                step={15}
                placeholder="—"
                value={formData.durationMinutes}
                onChange={(minutes) => setFormData({ ...formData, durationMinutes: minutes || undefined })}
                onClear={() => setFormData({ ...formData, durationMinutes: undefined })}
              />
            </div>
          </div>

          <h4 className={`${sectionTitleClass} pt-2`}>Detalhes</h4>

          {!linkedPast && (
            <div>
              <label htmlFor="session-form-past" className={labelClass}>
                Encontro do Acervo (opcional)
              </label>
              <SelectDropdown
                id="session-form-past"
                value=""
                placeholder="Vincular a um encontro oficial"
                ariaLabel="Vincular a um encontro do Acervo"
                options={PAST_SESSIONS.map((p) => ({ value: p.id, label: `${pastSessionTitle(p)} · ${p.date}` }))}
                onChange={(id) => setFormData((prev) => ({ ...prev, pastSessionId: id }))}
              />
            </div>
          )}

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
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:text-success hover:border-success transition-colors"
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
                className="mt-2 text-xs font-semibold text-danger-600 bg-danger/10 border border-danger/20 rounded-xl px-3.5 py-2.5"
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
                      <FileText className="w-3.5 h-3.5 text-success shrink-0" />
                    )}
                    <span className="text-xs font-medium text-gray-700 truncate flex-1">{file.name}</span>
                    <span className="text-2xs text-gray-400 shrink-0">{formatFileSize(file.fileSize)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          challengeFiles: (prev.challengeFiles || []).filter((f) => f.id !== file.id),
                        }))
                      }
                      aria-label="Remover arquivo"
                      className="p-1 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 shrink-0"
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
                Ferramentas que aprendeu
              </label>
              <ToolsInput
                id="session-form-tool"
                value={formData.toolLearned || ''}
                onChange={(toolLearned) => setFormData((prev) => ({ ...prev, toolLearned }))}
                suggestions={toolSuggestions}
              />
            </div>

            <div>
              <label htmlFor="session-form-score" className={labelClass}>
                Pontuação
              </label>
              <NumberStepper
                id="session-form-score"
                min={0}
                placeholder="—"
                value={formData.score}
                onChange={(score) => setFormData({ ...formData, score })}
                onClear={() => setFormData({ ...formData, score: undefined })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="session-form-notes" className={labelClass}>
              Anotações
            </label>
            <textarea
              id="session-form-notes"
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Principais aprendizados, links, próximos passos…"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 resize-y placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-success/30"
            />
            <p className="mt-1 text-2xs text-gray-400">Aceita markdown: **negrito**, listas com -, links.</p>
          </div>

          <div>
            <span className={labelClass}>Foto ou vídeo de comprovação</span>
            <div
              id="session-form-proof"
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
              className="w-full border-2 border-dashed border-gray-300 hover:border-success bg-surface-muted rounded-2xl p-6 text-center cursor-pointer transition-all space-y-3"
            >
              {proofVideoSrc ? (
                <div className="flex items-center justify-center gap-4">
                  <video src={proofVideoSrc} className="h-24 max-w-xs rounded-lg shadow-xs" muted controls />
                  <p className="text-xs text-success font-medium">Vídeo carregado com sucesso!</p>
                </div>
              ) : formData.proofImage ? (
                <div className="flex items-center justify-center gap-4">
                  <img
                    src={formData.proofImage}
                    alt="Prévia"
                    className="h-24 max-w-xs object-contain rounded-lg shadow-xs"
                  />
                  <p className="text-xs text-success font-medium">Foto carregada com sucesso!</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Arraste ou clique para anexar</p>
                  <p className="text-2xs text-gray-400">Imagem até 4MB ou vídeo até 50MB</p>
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
                className="mt-2 text-xs font-semibold text-danger-600 bg-danger/10 border border-danger/20 rounded-xl px-3.5 py-2.5"
              >
                {proofError}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className={buttonClasses({ variant: 'ghost' })}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.title?.trim() || !formData.date}
              className={buttonClasses({ variant: 'primary' })}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? (videoFile ? 'Enviando vídeo...' : 'Salvando...') : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
