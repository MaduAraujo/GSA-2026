import { Calendar, Flag, Loader2, Share2, Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { Challenge, ChallengeSocialLink, ChallengeStatus, PostPlatform, SocialPost } from '../../types';
import { formatDateBR } from '../../utils/date';
import { DatePicker } from '../DatePicker';
import { NumberStepper } from '../NumberStepper';
import { SelectDropdown } from '../SelectDropdown';
import { planChallengeSave, RESULT_PLATFORMS, STATUSES } from './challengeModel';
import type { ChallengeFormState } from './useChallengeForm';

const MAX_RESULT_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_RESULT_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // Supabase Free plan caps uploads at 50MB

interface ChallengeFormModalProps {
  form: ChallengeFormState;
  categories: string[];
  posts: SocialPost[];
  onSaveChallenge: (challenge: Challenge, resultVideoFile?: File) => Promise<void>;
  onSavePost: (post: SocialPost) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
}

function MediaPreview({ kind, src, onRemove }: { kind: 'video' | 'image'; src: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-200">
      {kind === 'video' ? (
        <video src={src} muted className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-200" />
      ) : (
        <img
          src={src}
          alt="Prévia do resultado"
          className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-200"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-green-700">{kind === 'video' ? 'Vídeo anexado' : 'Imagem anexada'}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={kind === 'video' ? 'Remover vídeo' : 'Remover imagem'}
        className="p-1.5 rounded-lg text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ChallengeFormModal({
  form,
  categories,
  posts,
  onSaveChallenge,
  onSavePost,
  onDeletePost,
}: ChallengeFormModalProps) {
  const { formData, setFormData, isEditMode, videoFile, videoPreviewUrl } = form;
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDate, setPendingDate] = useState('');
  const [pendingLinkPlatform, setPendingLinkPlatform] = useState<PostPlatform>('LinkedIn');
  const [pendingLinkUrl, setPendingLinkUrl] = useState('');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, form.close);

  const handleMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setMediaError(null);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

    if (!isImage && !isVideo) {
      setMediaError('Envie um arquivo de imagem ou vídeo.');
      return;
    }
    if (isImage && file.size > MAX_RESULT_IMAGE_SIZE_BYTES) {
      setMediaError(`Imagem muito grande (${sizeMb}MB). O limite é 4MB.`);
      return;
    }
    if (isVideo && file.size > MAX_RESULT_VIDEO_SIZE_BYTES) {
      setMediaError(`Vídeo muito grande (${sizeMb}MB). O limite é 50MB.`);
      return;
    }

    if (isVideo) {
      form.setVideo(file);
      setFormData((prev) => ({ ...prev, resultImage: '', resultMediaType: 'video' }));
      return;
    }

    form.setVideo(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, resultImage: event.target?.result as string, resultMediaType: 'image' }));
    };
    reader.readAsDataURL(file);
  };

  const addDate = (date: string) => {
    if (!date) return;
    setFormData((prev) => {
      const existing = prev.dates || [];
      return existing.includes(date) ? prev : { ...prev, dates: [...existing, date].sort() };
    });
  };

  const addSocialLink = () => {
    const link = pendingLinkUrl.trim();
    if (!link) return;
    const newLink: ChallengeSocialLink = { id: crypto.randomUUID(), platform: pendingLinkPlatform, link };
    setFormData((prev) => ({ ...prev, socialLinks: [...(prev.socialLinks || []), newLink] }));
    setPendingLinkUrl('');
  };

  const clearMedia = () => {
    form.setVideo(null);
    setFormData((prev) => ({ ...prev, resultImage: '', resultMediaType: 'image' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.description?.trim()) return;

    setIsSaving(true);
    try {
      const plan = planChallengeSave(formData, posts, !!videoFile);
      if (plan.post) await onSavePost(plan.post);
      for (const staleId of plan.staleLinkedPostIds) {
        await onDeletePost(staleId);
      }
      await onSaveChallenge(plan.challenge, videoFile || undefined);
      form.close();
      form.reset();
    } catch (err) {
      console.error(err);
      alert('Não foi possível salvar o desafio. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const labelClass = 'block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-form-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col"
      >
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#34A853]/10 text-[#1E8E3E] flex items-center justify-center">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 id="challenge-form-heading" className="text-lg sm:text-xl font-bold text-gray-900">
                  {isEditMode ? 'Editar Desafio' : 'Novo Desafio'}
                </h3>
                <p className="text-xs text-gray-500">Registre os desafios do programa</p>
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
              <label htmlFor="challenge-form-title" className={labelClass}>
                Título do Desafio *
              </label>
              <input
                id="challenge-form-title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-[#34A853]/30 focus:border-[#34A853] bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="challenge-form-category" className={labelClass}>
                  Categoria
                </label>
                <input
                  id="challenge-form-category"
                  type="text"
                  list="challenge-category-suggestions"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                />
                {categories.length > 0 && (
                  <datalist id="challenge-category-suggestions">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                )}
              </div>

              <div>
                <span className={labelClass}>Status</span>
                <SelectDropdown
                  value={formData.status || ''}
                  onChange={(v) => setFormData({ ...formData, status: v as ChallengeStatus })}
                  options={STATUSES.map((s) => ({ value: s, label: s }))}
                  ariaLabel="Status"
                  align="center"
                />
              </div>
            </div>

            <div>
              <label htmlFor="challenge-form-deadline" className={labelClass}>
                Dia(s) do desafio
              </label>
              <DatePicker
                id="challenge-form-deadline"
                value={pendingDate}
                onChange={(date) => {
                  addDate(date);
                  setPendingDate('');
                }}
              />

              {formData.dates && formData.dates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.dates.map((date) => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#34A853]/10 text-[#1E8E3E] border border-[#34A853]/20"
                    >
                      <Calendar className="w-3 h-3" />
                      {formatDateBR(date)}
                      <button
                        type="button"
                        aria-label={`Remover dia ${formatDateBR(date)}`}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, dates: (prev.dates || []).filter((d) => d !== date) }))
                        }
                        className="hover:text-[#EA4335]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="challenge-form-points" className={labelClass}>
                Pontos
              </label>
              <NumberStepper
                id="challenge-form-points"
                min={0}
                value={formData.points ?? 0}
                onChange={(points) => setFormData({ ...formData, points })}
              />
            </div>

            <div>
              <label htmlFor="challenge-form-link" className={labelClass}>
                Link do desafio
              </label>
              <input
                id="challenge-form-link"
                type="url"
                value={formData.link || ''}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
              />
            </div>

            <div>
              <label htmlFor="challenge-form-description" className={labelClass}>
                Descrição *
              </label>
              <textarea
                id="challenge-form-description"
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#34A853]/30"
              />
            </div>

            <div>
              <label htmlFor="challenge-form-result" className={labelClass}>
                Resultado
              </label>
              <textarea
                id="challenge-form-result"
                rows={3}
                value={formData.result || ''}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#34A853]/30"
              />
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Publicação</h4>

              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 items-end">
                <div>
                  <span className="block text-[11px] font-bold text-gray-600 mb-1">Plataforma</span>
                  <SelectDropdown
                    value={pendingLinkPlatform}
                    onChange={(v) => setPendingLinkPlatform(v as PostPlatform)}
                    options={RESULT_PLATFORMS.map((p) => ({ value: p, label: p }))}
                    ariaLabel="Plataforma"
                    buttonClassName="w-full pl-3.5 pr-8 py-2.5 rounded-xl text-sm border border-gray-200 bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="challenge-form-social-link"
                    className="block text-[11px] font-bold text-gray-600 mb-1"
                  >
                    Link da publicação
                  </label>
                  <input
                    id="challenge-form-social-link"
                    type="url"
                    value={pendingLinkUrl}
                    onChange={(e) => setPendingLinkUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={addSocialLink}
                  disabled={!pendingLinkUrl.trim()}
                  className="px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
              </div>

              {formData.socialLinks && formData.socialLinks.length > 0 && (
                <div className="space-y-1.5">
                  {formData.socialLinks.map((social) => (
                    <div
                      key={social.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                      <span className="text-xs font-bold text-gray-700 shrink-0">{social.platform}</span>
                      <span className="text-xs text-gray-500 truncate flex-1">{social.link}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            socialLinks: (prev.socialLinks || []).filter((l) => l.id !== social.id),
                          }))
                        }
                        aria-label="Remover link"
                        className="p-1 rounded-lg text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label
                  htmlFor="challenge-form-external-link"
                  className="block text-[11px] font-bold text-gray-600 mb-1"
                >
                  Link externo
                </label>
                <p className="text-[11px] text-gray-500 mb-1.5">
                  Se o desafio foi feito em um link externo (site, documento, repositório, etc.) além das redes sociais,
                  cole o link aqui.
                </p>
                <input
                  id="challenge-form-external-link"
                  type="url"
                  value={formData.externalLink || ''}
                  onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-white"
                />
              </div>

              <div>
                <span className="block text-[11px] font-bold text-gray-600 mb-2">Imagem ou vídeo</span>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleMediaChange}
                />
                {videoPreviewUrl ? (
                  <MediaPreview kind="video" src={videoPreviewUrl} onRemove={clearMedia} />
                ) : formData.resultImage && formData.resultMediaType === 'video' ? (
                  <MediaPreview kind="video" src={formData.resultImage} onRemove={clearMedia} />
                ) : formData.resultImage ? (
                  <MediaPreview
                    kind="image"
                    src={formData.resultImage}
                    onRemove={() => setFormData((prev) => ({ ...prev, resultImage: '' }))}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => mediaInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2.5 py-6 px-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#1A73E8] bg-white transition-all"
                  >
                    <Upload className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="max-w-[80%] text-xs text-gray-600 text-center truncate">
                      Anexe uma imagem, vídeo (até 50MB) ou captura da publicação
                    </span>
                  </button>
                )}
                {mediaError && (
                  <p
                    role="alert"
                    className="mt-2 text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5"
                  >
                    {mediaError}
                  </p>
                )}
              </div>
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
                disabled={isSaving || !formData.title?.trim() || !formData.description?.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#34A853] hover:bg-[#2E7D32] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
