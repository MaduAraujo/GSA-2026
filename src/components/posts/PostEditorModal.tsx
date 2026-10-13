import confetti from 'canvas-confetti';
import { FileText, Image as ImageIcon, Share2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { ChallengeSocialLink, PostPlatform, PostStatus, SocialPost } from '../../types';
import { isHttpUrl } from '../../utils/safeUrl';
import { DatePicker } from '../DatePicker';
import { NumberStepper } from '../NumberStepper';
import { SelectDropdown } from '../SelectDropdown';
import {
  canSavePost,
  CHALLENGE_RESULT_TONE,
  finalizePost,
  MANUAL_TONE,
  PLATFORMS,
  toLocalDateInputValue,
} from './postModel';

interface PostEditorModalProps {
  draft: Partial<SocialPost>;
  isNew: boolean;
  onChange: (draft: Partial<SocialPost>) => void;
  onClose: () => void;
  onSavePost: (post: SocialPost) => Promise<void>;
}

const labelClass = 'block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1';

export function PostEditorModal({ draft, isNew, onChange, onClose, onSavePost }: PostEditorModalProps) {
  const [pendingLinkPlatform, setPendingLinkPlatform] = useState<PostPlatform>('LinkedIn');
  const [pendingLinkUrl, setPendingLinkUrl] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onClose);

  const isManual = draft.tone === MANUAL_TONE;
  const isChallengeResult = draft.tone === CHALLENGE_RESULT_TONE;

  const addSocialLink = () => {
    const link = pendingLinkUrl.trim();
    if (!link) return;
    const newLink: ChallengeSocialLink = { id: crypto.randomUUID(), platform: pendingLinkPlatform, link };
    onChange({ ...draft, socialLinks: [...(draft.socialLinks || []), newLink] });
    setPendingLinkUrl('');
  };

  const handleSave = async () => {
    if (!canSavePost(draft) || !draft.title || !draft.status) return;
    await onSavePost(finalizePost({ ...draft, title: draft.title, status: draft.status }));
    onClose();
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#EA4335', '#1A73E8', '#34A853', '#FBBC04'],
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-editor-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col"
      >
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 id="post-editor-heading" className="text-lg sm:text-xl font-bold text-gray-900">
                  {isNew ? 'Novo Post' : 'Editar Post'}
                </h3>
                <p className="text-xs text-gray-500">Registre um post que você já publicou.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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
                  buttonClassName="w-full px-3.5 py-2 pr-8 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD]"
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
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1A73E8] hover:underline break-all"
                    >
                      <Share2 className="w-4 h-4 shrink-0" />
                      Ver publicação{draft.platform ? ` no ${draft.platform}` : ''}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">Nenhum link sincronizado.</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Este post é sincronizado com um desafio na tela de Desafios — edite o link por lá.
                </p>
              </div>
            ) : isManual ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 items-end">
                  <div>
                    <span className="block text-[11px] font-bold text-gray-600 mb-1">Plataforma</span>
                    <SelectDropdown
                      value={pendingLinkPlatform}
                      onChange={(v) => setPendingLinkPlatform(v as PostPlatform)}
                      options={PLATFORMS.map((plt) => ({ value: plt, label: plt }))}
                      ariaLabel="Plataforma"
                      buttonClassName="w-full pl-3.5 pr-8 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="post-form-link" className="block text-[11px] font-bold text-gray-600 mb-1">
                      Link da publicação *
                    </label>
                    <input
                      id="post-form-link"
                      type="url"
                      required
                      value={pendingLinkUrl}
                      onChange={(e) => setPendingLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
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

                {draft.socialLinks && draft.socialLinks.length > 0 && (
                  <div className="space-y-1.5">
                    {draft.socialLinks.map((social) => (
                      <div
                        key={social.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
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
                          className="p-1 rounded-lg text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 shrink-0"
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
                    <span className="text-[11px] text-gray-500">{draft.content?.length || 0} caracteres</span>
                  </div>
                  <textarea
                    rows={8}
                    aria-label="Conteúdo do post"
                    placeholder="Escreva o conteúdo do post..."
                    value={draft.content || ''}
                    onChange={(e) => onChange({ ...draft, content: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#EA4335]/30 leading-relaxed font-sans"
                  />
                </div>

                {draft.visualIdea && (
                  <div className="p-3.5 rounded-2xl bg-[#FBBC04]/15 border border-[#FBBC04]/30 flex items-start gap-2.5">
                    <ImageIcon className="w-4 h-4 text-[#B06000] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-gray-900 font-semibold">Sugestão de Mídia / Imagem:</strong>
                      <p className="text-gray-700 mt-0.5">{draft.visualIdea}</p>
                    </div>
                  </div>
                )}

                {draft.status === 'Publicado' && (
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                    <label htmlFor="post-form-published-url" className="block text-[11px] font-bold text-gray-600 mb-1">
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

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSavePost(draft)}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-[#EA4335] hover:bg-[#D93025] text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#EA4335]"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
