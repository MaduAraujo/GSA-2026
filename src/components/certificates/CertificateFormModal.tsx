import confetti from 'canvas-confetti';
import { buttonClasses } from '../ui/buttonClasses';
import { Modal, ModalHeader } from '../ui/Modal';
import { ChevronDown, FileText, Loader2, Pencil, Sparkles, Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useToast } from '../../app/ToastProvider';
import { useDismiss } from '../../hooks/useDismiss';
import { AiApiService } from '../../services/aiApi';
import type { Certificate } from '../../types';
import { errorMessage } from '../../utils/errors';
import { AI_PAYLOAD_LIMIT_LABEL, downscaleImageForAi, exceedsAiPayloadLimit } from '../../utils/imageForAi';
import { DatePicker } from '../DatePicker';
import { NumberStepper } from '../NumberStepper';
import type { CertificateFormState } from './useCertificateForm';
import { BRAND, CONFETTI_COLORS } from '../../theme/colors';

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;

interface CertificateFormModalProps {
  form: CertificateFormState;
  categories: string[];
  onSaveCertificate: (cert: Certificate) => Promise<void>;
}

export function CertificateFormModal({ form, categories, onSaveCertificate }: CertificateFormModalProps) {
  const { formData, setFormData, isEditMode, filePreview, fileName, fileType, fileError } = form;
  const [skillInput, setSkillInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategorySuggestOpen, setIsCategorySuggestOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categorySuggestRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  useDismiss(categorySuggestRef, isCategorySuggestOpen, () => setIsCategorySuggestOpen(false));

  const loadFile = (file: File) => {
    form.setFileError(null);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      form.setFileError(
        `Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O limite é 4MB — comprima a imagem ou o PDF antes de enviar.`,
      );
      return;
    }
    form.setFileName(file.name);
    form.setFileType(file.type === 'application/pdf' ? 'pdf' : 'image');
    const reader = new FileReader();
    reader.onload = (event) => form.setFilePreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;
    if (!formData.skills?.includes(skill)) {
      setFormData({ ...formData, skills: [...(formData.skills || []), skill] });
    }
    setSkillInput('');
  };

  const handleAiAutoFill = async () => {
    if (!filePreview) return;
    setIsAnalyzing(true);
    try {
      const payload = fileType === 'image' ? await downscaleImageForAi(filePreview) : filePreview;
      if (exceedsAiPayloadLimit(payload)) {
        toast.show({
          message: `Este arquivo é grande demais para o preenchimento com IA (limite de ${AI_PAYLOAD_LIMIT_LABEL}). Preencha os campos manualmente ou envie um PDF menor.`,
          tone: 'error',
        });
        return;
      }
      const res = await AiApiService.analyzeCertificate({
        title: formData.title || fileName || 'Certificado Google 2026',
        issuer: formData.issuer || undefined,
        imageBase64: payload,
      });

      setFormData((prev) => ({
        ...prev,
        title: res.suggestedTitle || prev.title,
        issuer: res.issuer || prev.issuer,
        category: res.category || prev.category,
        description: res.summary || prev.description,
        skills: Array.from(new Set([...(prev.skills || []), ...res.skills])),
      }));

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: [BRAND.primary, BRAND.success, BRAND.warning, BRAND.danger],
      });
    } catch (err) {
      console.warn('Erro na IA:', err);
      toast.show({
        message: `Não foi possível preencher automaticamente com a IA: ${errorMessage(err, 'tente novamente em instantes.')}`,
        tone: 'error',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setIsSaving(true);
    try {
      await onSaveCertificate({
        id: formData.id || crypto.randomUUID(),
        title: formData.title.trim(),
        issuer: (formData.issuer || '').trim(),
        issueDate: formData.issueDate || new Date().toISOString().split('T')[0]!,
        category: (formData.category || 'Outros').trim(),
        description: (formData.description || '').trim(),
        fileData: filePreview || undefined,
        fileName: fileName || undefined,
        fileType,
        skills: (formData.skills || []).map((s) => s.trim()).filter(Boolean),
        credentialId: formData.credentialId,
        credentialUrl: formData.credentialUrl,
        hours: Number(formData.hours) || 0,
        minutes: Number(formData.minutes) || 0,
        isFavorite: formData.isFavorite || false,
        createdAt: formData.createdAt || new Date().toISOString(),
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: CONFETTI_COLORS,
      });
      form.close();
      form.reset();
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível salvar o certificado. Tente novamente.', tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus:border-primary bg-surface-muted';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <Modal onClose={form.close} labelledBy="cert-form-heading" size="2xl">
      <ModalHeader
        titleId="cert-form-heading"
        title={isEditMode ? 'Editar Certificado' : 'Novo Certificado'}
        subtitle={
          isEditMode ? 'Atualize os dados do certificado' : 'Envie o arquivo e preencha os dados do certificado'
        }
        icon={isEditMode ? Pencil : Upload}
        iconClassName="bg-primary/10 text-primary"
        onClose={form.close}
      />
      <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
        <button
          type="button"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          aria-label={filePreview ? `Trocar arquivo (${fileName})` : 'Selecionar arquivo do certificado'}
          className="w-full border-2 border-dashed border-gray-300 hover:border-primary bg-surface-muted rounded-2xl p-6 text-center cursor-pointer transition-all space-y-3"
        >
          {filePreview ? (
            <div className="flex items-center justify-center gap-4">
              {fileType === 'pdf' ? (
                <FileText className="w-12 h-12 text-danger" />
              ) : (
                <img src={filePreview} alt="Preview" className="h-20 max-w-xs object-contain rounded-lg shadow-xs" />
              )}
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 truncate max-w-50">{fileName}</p>
                <p className="text-xs text-success font-medium">Arquivo carregado · clique para trocar</p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Arraste ou clique para selecionar</p>
              <p className="text-xs text-gray-500">PNG, JPG ou PDF até 4MB</p>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {fileError && (
          <p
            role="alert"
            className="text-xs font-semibold text-danger-600 bg-danger/10 border border-danger/20 rounded-xl px-3.5 py-2.5"
          >
            {fileError}
          </p>
        )}

        {filePreview && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <Sparkles aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <p className="text-sm text-gray-700">
                {isAnalyzing
                  ? 'Lendo o certificado…'
                  : 'A IA pode ler o arquivo e preencher título, emissor, categoria e habilidades.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAiAutoFill}
              disabled={isAnalyzing}
              className="self-end sm:self-auto px-4 py-2 rounded-full bg-primary hover:bg-primary-700 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 shrink-0 transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100 disabled:cursor-wait"
            >
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isAnalyzing ? 'Lendo...' : 'Preencher com IA'}</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cert-form-title" className={labelClass}>
              Título do certificado *
            </label>
            <input
              id="cert-form-title"
              type="text"
              required
              placeholder="Ex.: Google Cloud Digital Leader"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cert-form-issuer" className={labelClass}>
                Emissor / Organização
              </label>
              <input
                id="cert-form-issuer"
                type="text"
                placeholder="Ex.: Google Cloud Skills Boost"
                value={formData.issuer}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="cert-form-category" className={labelClass}>
                Categoria
              </label>
              <div className="relative" ref={categorySuggestRef}>
                <input
                  id="cert-form-category"
                  type="text"
                  placeholder="Ex.: Google Cloud"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`${inputClass} ${categories.length > 0 ? 'pr-8' : ''}`}
                />
                {categories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCategorySuggestOpen((v) => !v)}
                    aria-label="Ver categorias já criadas"
                    aria-haspopup="listbox"
                    aria-expanded={isCategorySuggestOpen}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${isCategorySuggestOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
                {isCategorySuggestOpen && categories.length > 0 && (
                  <div
                    role="listbox"
                    className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-48 overflow-y-auto"
                  >
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        role="option"
                        aria-selected={formData.category === cat}
                        onClick={() => {
                          setFormData({ ...formData, category: cat });
                          setIsCategorySuggestOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="cert-form-date" className={labelClass}>
              Data de emissão
            </label>
            <DatePicker
              id="cert-form-date"
              value={formData.issueDate || ''}
              onChange={(date) => setFormData({ ...formData, issueDate: date })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cert-form-hours" className={labelClass}>
                Carga horária (horas)
              </label>
              <NumberStepper
                id="cert-form-hours"
                min={0}
                value={formData.hours ?? 0}
                onChange={(hours) => setFormData({ ...formData, hours })}
              />
            </div>

            <div>
              <label htmlFor="cert-form-minutes" className={labelClass}>
                Carga horária (minutos)
              </label>
              <NumberStepper
                id="cert-form-minutes"
                min={0}
                max={59}
                value={formData.minutes ?? 0}
                onChange={(minutes) => setFormData({ ...formData, minutes })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="cert-form-skill" className={labelClass}>
              Habilidades e competências
            </label>
            <div className="flex gap-2">
              <input
                id="cert-form-skill"
                type="text"
                placeholder="Ex.: BigQuery — Enter para adicionar"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-surface-muted"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
              >
                Adicionar
              </button>
            </div>

            {formData.skills && formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    #{skill}
                    <button
                      type="button"
                      aria-label={`Remover habilidade ${skill}`}
                      onClick={() =>
                        setFormData({ ...formData, skills: formData.skills?.filter((s) => s !== skill) || [] })
                      }
                      className="hover:text-danger"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="cert-form-description" className={labelClass}>
              Descrição
            </label>
            <textarea
              id="cert-form-description"
              placeholder="O que você aprendeu ou construiu neste curso"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-surface-muted focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cert-form-credential-id" className={labelClass}>
                Código de validação
              </label>
              <input
                id="cert-form-credential-id"
                type="text"
                placeholder="Ex.: 8f3a-21c9"
                value={formData.credentialId || ''}
                onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-surface-muted"
              />
            </div>

            <div>
              <label htmlFor="cert-form-credential-url" className={labelClass}>
                URL de verificação
              </label>
              <input
                id="cert-form-credential-url"
                type="url"
                placeholder="https://"
                value={formData.credentialUrl || ''}
                onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-surface-muted"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button type="button" onClick={form.close} className={buttonClasses({ variant: 'ghost' })}>
              Cancelar
            </button>
            <button
              id="submit-cert-form"
              type="submit"
              disabled={isSaving || !formData.title?.trim()}
              className={buttonClasses({ variant: 'primary' })}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
