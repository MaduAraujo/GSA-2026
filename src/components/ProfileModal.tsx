import React, { useState, useEffect, useRef } from 'react';
import { User, Trophy, Mail, Globe, Sparkles, X, Save, CheckCircle2, Award, Bell, BellOff, Upload, Trash2, ChevronDown, Link2, Copy, Check, Smartphone, Loader2 } from 'lucide-react';
import { AmbassadorProfile } from '../types';
import { RemindersService } from '../services/reminders';
import { PushNotificationsService } from '../services/pushNotifications';
import { usePersistedState } from '../hooks/usePersistedState';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AmbassadorProfile;
  onSaveProfile: (profile: AmbassadorProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = usePersistedState<AmbassadorProfile>('gsa_profile_form_draft', profile);
  const [saved, setSaved] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(RemindersService.isEnabled());
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [isTogglingPush, setIsTogglingPush] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    PushNotificationsService.getCurrentSubscription()
      .then((sub) => setPushSubscribed(!!sub))
      .catch(() => setPushSubscribed(false));
  }, [isOpen]);

  const handleTogglePush = async () => {
    setIsTogglingPush(true);
    setPushStatus(null);
    try {
      if (pushSubscribed) {
        await PushNotificationsService.unsubscribe();
        setPushSubscribed(false);
      } else {
        await PushNotificationsService.subscribe();
        setPushSubscribed(true);
      }
    } catch (err: any) {
      setPushStatus(err.message || 'Não foi possível ativar as notificações push.');
    } finally {
      setIsTogglingPush(false);
    }
  };

  const handleSendTestPush = async () => {
    setIsSendingTestPush(true);
    setPushStatus(null);
    try {
      await PushNotificationsService.sendTestPush();
      setPushStatus('Notificação de teste enviada!');
    } catch (err: any) {
      setPushStatus(err.message || 'Falha ao enviar notificação de teste.');
    } finally {
      setIsSendingTestPush(false);
    }
  };

  const slugify = (value: string) => {
    const stripped = value
      .normalize('NFD')
      .split('')
      .filter((ch) => ch.charCodeAt(0) < 0x0300 || ch.charCodeAt(0) > 0x036f)
      .join('');
    return stripped
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTogglePublicPortfolio = () => {
    const turningOn = !formData.isPublic;
    setFormData((prev) => ({
      ...prev,
      isPublic: turningOn,
      publicSlug: turningOn && !prev.publicSlug ? `${slugify(prev.name || 'embaixadora')}-${Math.random().toString(36).slice(2, 6)}` : prev.publicSlug,
    }));
  };

  const handleCopyPortfolioLink = () => {
    if (!formData.publicSlug) return;
    const url = `${window.location.origin}/p/${formData.publicSlug}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; 

  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [avatarMenuOpen]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError(`Imagem muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O limite é 2MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPendingAvatar(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const confirmPendingAvatar = () => {
    if (!pendingAvatar) return;
    setFormData((prev) => ({ ...prev, avatarUrl: pendingAvatar }));
    setPendingAvatar(null);
  };

  const cancelPendingAvatar = () => setPendingAvatar(null);

  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (justOpened) {
      setFormData({ ...profile });
      setPendingAvatar(null);
      setAvatarError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleReminders = async () => {
    if (remindersEnabled) {
      RemindersService.disable();
      setRemindersEnabled(false);
      setReminderStatus(null);
      return;
    }

    if (!RemindersService.isSupported()) {
      setReminderStatus('Seu navegador não suporta notificações.');
      return;
    }

    const granted = await RemindersService.enable();
    setRemindersEnabled(granted);
    setReminderStatus(granted ? null : 'Permissão de notificação negada pelo navegador.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <>
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Perfil de Embaixadora
              </h3>
              <p className="text-xs text-gray-600">
                Personalize seus dados.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-4">
          <div className="relative shrink-0" ref={avatarMenuRef}>
            <img
              src={formData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt="Avatar"
              className="w-14 h-14 rounded-xl object-cover ring-2 ring-blue-600/30"
            />
            <button
              type="button"
              onClick={() => setAvatarMenuOpen((v) => !v)}
              aria-label="Opções da foto de perfil"
              aria-expanded={avatarMenuOpen}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-600/40"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${avatarMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            {avatarMenuOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-2 w-40 rounded-xl bg-white border border-gray-200 shadow-lg py-1.5 z-10"
              >
                {formData.avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, avatarUrl: '' }));
                      setAvatarMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover foto</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      avatarInputRef.current?.click();
                      setAvatarMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-100"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Adicionar foto</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">{formData.name || 'Embaixadora Google'}</h4>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">{formData.role}</p>
            <p className="text-[11px] text-gray-500">{formData.university} • {formData.course}</p>
          </div>
        </div>
        {avatarError && (
          <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
            {avatarError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                Título / Cargo Oficial
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                Instituição de Ensino / Campus
              </label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                Curso / Graduação
              </label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A73E8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
              Mini Biografia
            </label>
            <textarea
              rows={2}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A73E8]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
              Meta para o Programa
            </label>
            <input
              type="text"
              value={formData.goal2026}
              onChange={(e) => setFormData({ ...formData, goal2026: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A73E8]"
            />
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${remindersEnabled ? 'bg-blue-600/10 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                {remindersEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Lembretes semanais de conteúdo</h4>
                <p className="text-[11px] text-gray-600">
                  {reminderStatus || 'Avisa se você ficar mais de 7 dias sem criar um post (enquanto o app estiver aberto).'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleReminders}
              aria-pressed={remindersEnabled}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                remindersEnabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-100'
              }`}
            >
              {remindersEnabled ? 'Ativado' : 'Ativar'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${pushSubscribed ? 'bg-blue-600/10 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Notificações push (app fechado)</h4>
                  <p className="text-[11px] text-gray-600">
                    {pushStatus || 'Recebe avisos mesmo com o navegador fechado, incluindo o lembrete semanal de conteúdo.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTogglePush}
                disabled={isTogglingPush}
                aria-pressed={pushSubscribed}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
                  pushSubscribed
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-100'
                }`}
              >
                {isTogglingPush ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : pushSubscribed ? 'Ativado' : 'Ativar'}
              </button>
            </div>
            {pushSubscribed && (
              <button
                type="button"
                onClick={handleSendTestPush}
                disabled={isSendingTestPush}
                className="text-[11px] font-bold text-blue-600 hover:underline disabled:opacity-60"
              >
                {isSendingTestPush ? 'Enviando...' : 'Enviar notificação de teste'}
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${formData.isPublic ? 'bg-blue-600/10 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Portfólio público</h4>
                  <p className="text-[11px] text-gray-600">
                    Gera um link somente-leitura com seu perfil e certificados, para compartilhar no LinkedIn ou currículo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTogglePublicPortfolio}
                aria-pressed={formData.isPublic}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  formData.isPublic
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-100'
                }`}
              >
                {formData.isPublic ? 'Ativado' : 'Ativar'}
              </button>
            </div>

            {formData.isPublic && formData.publicSlug && (
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-[11px] font-mono px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700">
                  {window.location.origin}/p/{formData.publicSlug}
                </code>
                <button
                  type="button"
                  onClick={handleCopyPortfolioLink}
                  className="shrink-0 p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                  aria-label="Copiar link do portfólio"
                  title="Copiar link"
                >
                  {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvo!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Perfil</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>

        {pendingAvatar && (
  <div className="flex items-center gap-3">
    <button
      type="button"
      className="flex-1 px-3 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all"
      onClick={() => {
      }}
    >
      Confirmar avatar
    </button>
    <button
      type="button"
      className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-all"
      onClick={() => {
      }}
    >
      Cancelar
    </button>
  </div>
)}
    </>
  );
};