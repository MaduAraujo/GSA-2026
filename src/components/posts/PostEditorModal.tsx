import confetti from 'canvas-confetti';
import { Modal, ModalHeader } from '../ui/Modal';
import { FileText, Image as ImageIcon, Loader2, Share2, X } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../app/ToastProvider';
import type { ChallengeSocialLink, PostPlatform, PostStatus, SocialPost } from '../../types';
import { isHttpUrl } from '../../utils/safeUrl';
import { DatePicker } from '../DatePicker';
import { NumberStepper } from '../NumberStepper';
import { SelectDropdown } from '../SelectDropdown';
import {
  canSavePost,
  CHALLENGE_RESULT_TONE,
  finalizePost,
  formatHashtag,
  getMissingPostFields,
  MANUAL_TONE,
  normalizeHttpUrl,
  PLATFORMS,
  toLocalDateInputValue,
} from './postModel';
import { parseHashtags } from './postView';
import { BRAND } from '../../theme/colors';

interface PostEditorModalProps {
  draft: Partial<SocialPost>;
  isNew: boolean;
  onChange: (draft: Partial<SocialPost>) => void;
  onClose: () => void;
  onSavePost: (post: SocialPost) => Promise<void>;
}

const INVALID_LINK_MESSAGE = 'Link inválido. Use um endereço como https://linkedin.com/posts/...';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

export function PostEditorModal({ draft, isNew, onChange, onClose, onSavePost }: PostEditorModalProps) {
  const [pendingLinkPlatform, setPendingLinkPlatform] = useState<PostPlatform>('LinkedIn');
  const [pendingLinkUrl, setPendingLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [initialSnapshot] = useState(() => JSON.stringify(draft));
  const toast = useToast();

  const isManual = draft.tone === MANUAL_TONE;
  const isChallengeResult = draft.tone === CHALLENGE_RESULT_TONE;
  const [hashtagInput, setHashtagInput] = useState('');
  const isDirty =
    JSON.stringify(draft) !== initialSnapshot || pendingLinkUrl.trim() !== '' || hashtagInput.trim() !== '';

  const commitHashtags = () => {
    if (!hashtagInput.trim()) return;
    onChange({ ...draft, hashtags: parseHashtags(hashtagInput, draft.hashtags ?? []) });
    setHashtagInput('');
  };

  const requestClose = () => {
    if (isSaving) return;
    if (isDirty) setIsConfirmingDiscard(true);
    else onClose();
  };

  const buildLink = (): ChallengeSocialLink | null => {
    const link = normalizeHttpUrl(pendingLinkUrl);
    return link ? { id: crypto.randomUUID(), platform: pendingLinkPlatform, link } : null;
  };

  const addSocialLink = () => {
    if (!pendingLinkUrl.trim()) return;
    const newLink = buildLink();
    if (!newLink) {
      setLinkError(INVALID_LINK_MESSAGE);
      return;
    }
    onChange({ ...draft, socialLinks: [...(draft.socialLinks || []), newLink] });
    setPendingLinkUrl('');
    setLinkError(null);
  };

  const pendingLink = isManual && pendingLinkUrl.trim() ? buildLink() : null;
  const withLink = pendingLink ? { ...draft, socialLinks: [...(draft.socialLinks || []), pendingLink] } : draft;
  const effectiveDraft = hashtagInput.trim()
    ? { ...withLink, hashtags: parseHashtags(hashtagInput, withLink.hashtags ?? []) }
    : withLink;
  const missingFields = getMissingPostFields(effectiveDraft);
  const hasInvalidPendingLink = isManual && pendingLinkUrl.trim() !== '' && !pendingLink;

  const handleSave = async () => {
    if (hasInvalidPendingLink) {
      setLinkError('Link inválido. Corrija ou apague antes de salvar.');
      return;
    }
    if (!canSavePost(effectiveDraft) || !effectiveDraft.title || !effectiveDraft.status) return;
    setIsSaving(true);
    try {
      await onSavePost(finalizePost({ ...effectiveDraft, title: effectiveDraft.title, status: effectiveDraft.status }));
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível salvar o post. Tente novamente.', tone: 'error' });
      setIsSaving(false);
      return;
    }
    onClose();
    toast.show({ message: isNew ? 'Post criado' : 'Post atualizado', tone: 'success' });
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: [BRAND.danger, BRAND.primary, BRAND.success, BRAND.warning],
    });
  };

  return (
    <Modal onClose={requestClose} labelledBy="post-editor-heading" size="3xl">
      <ModalHeader
        titleId="post-editor-heading"
        title={isNew ? 'Novo Post' : 'Editar Post'}
        subtitle="Registre um post que você já publicou."
        icon={FileText}
        iconClassName="bg-primary/10 text-primary"
        onClose={requestClose}
      />
      <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="post-form-title" className={labelClass}>
              Título *
            </label>
            <input
              id="post-form-title"
              type="text"
              required
              value={draft.title || ''}
              onChange={(e) => onChange({ ...draft, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50"
            />
          </div>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isManual || isChallengeResult ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}
          >
            {!isManual && (
              <div>
                <span className={labelClass}>Plataforma *</span>
                <SelectDropdown
                  value={draft.platform || 'LinkedIn'}
                  onChange={(v) => onChange({ ...draft, platform: v as PostPlatform })}
                  options={PLATFORMS.map((plt) => ({ value: plt, label: plt }))}
                  ariaLabel="Plataforma"
                  buttonClassName="w-full px-3.5 py-2 pr-8 rounded-xl text-sm border border-gray-200 bg-gray-50"
                />
              </div>
            )}

            <div>
              <span className={labelClass}>Status da Publicação *</span>
              <SelectDropdown
                value={draft.status || ''}
                onChange={(v) => onChange({ ...draft, status: v as PostStatus })}
                options={[
                  { value: 'Rascunho', label: 'Rascunho' },
                  { value: 'Agendado', label: 'Agendado' },
                  { value: 'Publicado', label: 'Publicado' },
                ]}
                ariaLabel="Status da Publicação"
                buttonClassName="w-full px-3.5 py-2 pr-8 rounded-xl text-sm border border-gray-200 bg-surface-muted"
                align="center"
              />
            </div>

            <div>
              <label htmlFor="post-form-score" className={labelClass}>
                Pontuação *
              </label>
              <NumberStepper
                id="post-form-score"
                min={0}
                value={draft.score ?? 0}
                onChange={(score) => onChange({ ...draft, score })}
              />
            </div>

            {!isChallengeResult && (
              <div>
                <label htmlFor="post-form-date" className={labelClass}>
                  Data *
                </label>
                <DatePicker
                  id="post-form-date"
                  value={draft.createdAt ? toLocalDateInputValue(draft.createdAt) : ''}
                  onChange={(date) => {
                    if (!date) return;
                    onChange({ ...draft, createdAt: new Date(`${date}T12:00:00`).toISOString() });
                  }}
                  align="center"
                />
              </div>
            )}
          </div>

          {isChallengeResult ? (
            <div>
              <span className={labelClass}>Link da Publicação</span>
              <div className="flex items-center gap-1.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                {isHttpUrl(draft.publishedUrl) ? (
                  <a
                    href={draft.publishedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline break-all"
                  >
                    <Share2 className="w-4 h-4 shrink-0" />
                    Ver publicação{draft.platform ? ` no ${draft.platform}` : ''}
                  </a>
                ) : (
                  <span className="text-sm text-gray-400">Nenhum link sincronizado.</span>
                )}
              </div>
              <p className="text-2xs text-gray-500 mt-1.5">
                Este post é sincronizado com um desafio na tela de Desafios — edite o link por lá.
              </p>
            </div>
          ) : isManual ? (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 items-end">
                <div>
                  <span className="block text-2xs font-bold text-gray-600 mb-1">Plataforma</span>
                  <SelectDropdown
                    value={pendingLinkPlatform}
                    onChange={(v) => setPendingLinkPlatform(v as PostPlatform)}
                    options={PLATFORMS.map((plt) => ({ value: plt, label: plt }))}
                    ariaLabel="Plataforma"
                    buttonClassName="w-full pl-3.5 pr-8 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                  />
                </div>
                <div>
                  <label htmlFor="post-form-link" className="block text-2xs font-bold text-gray-600 mb-1">
                    Link da publicação *
                  </label>
                  <input
                    id="post-form-link"
                    type="url"
                    inputMode="url"
                    value={pendingLinkUrl}
                    onChange={(e) => {
                      setPendingLinkUrl(e.target.value);
                      setLinkError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSocialLink();
                      }
                    }}
                    onBlur={() => {
                      if (pendingLinkUrl.trim() && !buildLink()) setLinkError(INVALID_LINK_MESSAGE);
                    }}
                    placeholder="https://..."
                    aria-invalid={linkError ? true : undefined}
                    aria-describedby={linkError ? 'post-form-link-error' : undefined}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-gray-50 ${
                      linkError
                        ? 'border-danger-600 focus-visible:ring-2 focus-visible:ring-danger-600/30'
                        : 'border-gray-200'
                    }`}
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
              {linkError ? (
                <p id="post-form-link-error" role="alert" className="text-2xs font-medium text-danger-600">
                  {linkError}
                </p>
              ) : (
                <p className="text-2xs text-gray-500">
                  Pressione Enter para adicionar. Você pode registrar o mesmo post em várias redes.
                </p>
              )}

              {draft.socialLinks && draft.socialLinks.length > 0 && (
                <div className="space-y-1.5">
                  {draft.socialLinks.map((social) => (
                    <div
                      key={social.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
                    >
                      <Share2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-xs font-bold text-gray-700 shrink-0">{social.platform}</span>
                      <span className="text-xs text-gray-500 truncate flex-1">{social.link}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...draft,
                            socialLinks: (draft.socialLinks || []).filter((l) => l.id !== social.id),
                          })
                        }
                        aria-label="Remover link"
                        className="p-1 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-end mb-1">
                  <span className="text-2xs text-gray-500">{draft.content?.length || 0} caracteres</span>
                </div>
                <textarea
                  rows={8}
                  aria-label="Conteúdo do post"
                  placeholder="Escreva o conteúdo do post..."
                  value={draft.content || ''}
                  onChange={(e) => onChange({ ...draft, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-gray-200 bg-gray-50 focus-visible:ring-2 focus-visible:ring-danger/30 leading-relaxed font-sans"
                />
              </div>

              {draft.visualIdea && (
                <div className="p-3.5 rounded-2xl bg-warning/15 border border-warning/30 flex items-start gap-2.5">
                  <ImageIcon className="w-4 h-4 text-warning-700 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-gray-900 font-semibold">Sugestão de Mídia / Imagem:</strong>
                    <p className="text-gray-700 mt-0.5">{draft.visualIdea}</p>
                  </div>
                </div>
              )}

              {draft.status === 'Publicado' && (
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <label htmlFor="post-form-published-url" className="block text-2xs font-bold text-gray-600 mb-1">
                    Link da Postagem
                  </label>
                  <input
                    id="post-form-published-url"
                    type="url"
                    value={draft.publishedUrl || ''}
                    onChange={(e) => onChange({ ...draft, publishedUrl: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs border border-gray-300 bg-white"
                  />
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-[auto_auto_1fr] gap-4 pt-1">
            <div>
              <label htmlFor="post-form-likes" className={labelClass}>
                Curtidas
              </label>
              <NumberStepper
                id="post-form-likes"
                min={0}
                value={draft.likes ?? 0}
                onChange={(likes) => onChange({ ...draft, likes })}
              />
            </div>
            <div>
              <label htmlFor="post-form-comments" className={labelClass}>
                Comentários
              </label>
              <NumberStepper
                id="post-form-comments"
                min={0}
                value={draft.comments ?? 0}
                onChange={(comments) => onChange({ ...draft, comments })}
              />
            </div>
            <div>
              <label htmlFor="post-form-hashtags" className={labelClass}>
                Hashtags
              </label>
              <input
                id="post-form-hashtags"
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    commitHashtags();
                  } else if (e.key === 'Backspace' && !hashtagInput && (draft.hashtags?.length ?? 0) > 0) {
                    onChange({ ...draft, hashtags: (draft.hashtags ?? []).slice(0, -1) });
                  }
                }}
                onBlur={commitHashtags}
                placeholder="#gde #cloud"
                aria-describedby="post-form-hashtags-hint"
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50"
              />
              <p id="post-form-hashtags-hint" className="sr-only">
                Pressione Enter ou vírgula para adicionar.
              </p>
            </div>
          </div>

          {draft.hashtags && draft.hashtags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 -mt-2" aria-label="Hashtags do post">
              {draft.hashtags.map((tag) => (
                <li
                  key={tag}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
                >
                  {formatHashtag(tag)}
                  <button
                    type="button"
                    onClick={() => onChange({ ...draft, hashtags: (draft.hashtags ?? []).filter((h) => h !== tag) })}
                    aria-label={`Remover ${formatHashtag(tag)}`}
                    className="p-0.5 rounded-full hover:bg-primary/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isConfirmingDiscard ? (
            <div
              role="alertdialog"
              aria-label="Descartar alterações"
              className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <p className="text-sm font-semibold text-gray-800">Descartar as alterações não salvas?</p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDiscard(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Continuar editando
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-danger-600 hover:bg-danger-800 text-white"
                >
                  Descartar
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p id="post-form-missing" className="text-2xs text-gray-500 min-h-4" aria-live="polite">
                {missingFields.length > 0 && `Para salvar, preencha: ${missingFields.join(', ')}.`}
              </p>
              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || missingFields.length > 0}
                  aria-describedby={missingFields.length > 0 ? 'post-form-missing' : undefined}
                  className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                  {isSaving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
