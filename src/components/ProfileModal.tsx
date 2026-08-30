import React, { useState, useEffect, useRef } from 'react';
import { User, Trophy, Mail, Globe, Sparkles, X, Save, CheckCircle2, Award, Bell, BellOff, Upload, Trash2, ChevronDown } from 'lucide-react';
import { AmbassadorProfile } from '../types';
import { RemindersService } from '../services/reminders';

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
  const [formData, setFormData] = useState<AmbassadorProfile>({ ...profile });
  const [saved, setSaved] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(RemindersService.isEnabled());
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

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

    // Allow re-selecting the same file later (e.g. after canceling).
    e.target.value = '';
  };

  const confirmPendingAvatar = () => {
    if (!pendingAvatar) return;
    setFormData((prev) => ({ ...prev, avatarUrl: pendingAvatar }));
    setPendingAvatar(null);
  };

  const cancelPendingAvatar = () => setPendingAvatar(null);

  // The modal stays mounted while closed, so its own form state can go
  // stale relative to `profile` (e.g. it loads from storage after mount).
  // Re-sync whenever the modal is (re)opened.
  useEffect(() => {
    if (isOpen) {
      setFormData({ ...profile });
      setPendingAvatar(null);
      setAvatarError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#DADCE0] shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8EAED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#202124]">
                Perfil de Embaixadora
              </h3>
              <p className="text-xs text-[#5F6368]">
                Personalize seus dados.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-lg hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Preview */}
        <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] flex items-center gap-4">
          <div className="relative shrink-0" ref={avatarMenuRef}>
            <img
              src={formData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt="Avatar"
              className="w-14 h-14 rounded-xl object-cover ring-2 ring-[#1A73E8]/30"
            />
            <button
              type="button"
              onClick={() => setAvatarMenuOpen((v) => !v)}
              aria-label="Opções da foto de perfil"
              aria-expanded={avatarMenuOpen}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#DADCE0] shadow-xs flex items-center justify-center text-[#5F6368] hover:text-[#1A73E8] hover:border-[#1A73E8]/40"
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
                className="absolute left-0 top-full mt-2 w-40 rounded-xl bg-white border border-[#DADCE0] shadow-lg py-1.5 z-10"
              >
                {formData.avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, avatarUrl: '' }));
                      setAvatarMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#C5221F] hover:bg-[#FCE8E6]"
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#3C4043] hover:bg-[#F1F3F4]"
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
              <h4 className="font-bold text-[#202124] text-sm sm:text-base">{formData.name || 'Embaixadora Google'}</h4>
            </div>
            <p className="text-xs text-[#5F6368] mt-0.5">{formData.role}</p>
            <p className="text-[11px] text-[#80868B]">{formData.university} • {formData.course}</p>
          </div>
        </div>
        {avatarError && (
          <p role="alert" className="text-xs font-semibold text-[#C5221F] bg-[#FCE8E6] border border-[#F6AEA9] rounded-xl px-3.5 py-2.5">
            {avatarError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#3C4043] uppercase tracking-wider mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-[#DADCE0] bg-[#F8F9FA] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A73E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3C4043] uppercase tracking-wider mb-1">
                Título / Cargo Oficial
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-[#DADCE0] bg-[#F8F9FA] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A73E8]"
              />
            </div>
          </div>

          {/* University & Course */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#3C4043] uppercase tracking-wider mb-1">
                Instituição de Ensino / Campus
              </label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-[#DADCE0] bg-[#F8F9FA] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A73E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3C4043] uppercase tracking-wider mb-1">
                Curso / Graduação
              </label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-[#DADCE0] bg-[#F8F9FA] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A73E8]"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-[#3C4043] uppercase tracking-wider mb-1">
              Mini Biografia
            </label>
            <textarea
              rows={2}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-[#DADCE0] bg-[#F8F9FA] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A73E8]"
            />
          </div>

          {/* 2026 Goal */}
          <div>
            <label className="block text-xs font-bold text-[#3C4043] uppercase tracking-wider mb-1">
              Meta para o Programa
            </label>
            <input
              type="text"
              value={formData.goal2026}
              onChange={(e) => setFormData({ ...formData, goal2026: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-[#DADCE0] bg-[#F8F9FA] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A73E8]"
            />
          </div>

          {/* Weekly Content Reminders */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${remindersEnabled ? 'bg-[#1A73E8]/10 text-[#1A73E8]' : 'bg-gray-200 text-gray-500'}`}>
                {remindersEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#202124]">Lembretes semanais de conteúdo</h4>
                <p className="text-[11px] text-[#5F6368]">
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
                  ? 'bg-[#1A73E8] text-white hover:bg-[#1557B0]'
                  : 'bg-white border border-[#DADCE0] text-[#3C4043] hover:bg-[#F1F3F4]'
              }`}
            >
              {remindersEnabled ? 'Ativado' : 'Ativar'}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E8EAED] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1A73E8] hover:bg-[#1557B0] text-white shadow-xs transition-all active:scale-95 flex items-center gap-2"
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

    {/* Pending Avatar Preview Modal — a sibling of the dialog above, not
        nested inside it, so it isn't clipped by the outer backdrop-blur
        container's containing block (backdrop-filter creates one, which
        would confine a nested `fixed inset-0` to the parent's padded box
        instead of the real viewport). */}
    {pendingAvatar && (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      >
        <div className="bg-white rounded-2xl max-w-xs w-full border border-[#DADCE0] shadow-2xl p-6 space-y-4">
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold text-[#202124]">É assim que sua foto vai ficar</h4>
          </div>

          <img
            src={pendingAvatar}
            alt="Prévia da nova foto"
            className="w-32 h-32 mx-auto rounded-xl object-cover ring-2 ring-[#1A73E8]/40"
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={cancelPendingAvatar}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-[#5F6368] hover:bg-[#F1F3F4]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmPendingAvatar}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-bold bg-[#1A73E8] hover:bg-[#1557B0] text-white transition-all"
            >
              Usar esta foto
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
