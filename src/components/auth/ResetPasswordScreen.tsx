import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { isPasswordLeaked } from '../../utils/passwordSecurity';
import { authErrorCode, friendlyAuthError } from '../../lib/authErrors';
import { AuthAlert, AuthCard, AUTH_INPUT_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from './AuthCard';

interface ResetPasswordScreenProps {
  onDone: () => void;
  onCancel: () => void;
}

const MIN_LENGTH = 6;

function friendlyUpdateError(err: unknown): string {
  const code = authErrorCode(err);
  if (code === 'session_not_found' || code === 'session_expired')
    return 'Sua sessão de recuperação expirou. Peça um novo link de redefinição.';
  return friendlyAuthError(err, 'Não foi possível salvar a nova senha. Tente novamente.');
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onDone, onCancel }) => {
  const reduceMotion = useReducedMotion();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não são iguais. Digite a mesma senha nos dois campos.');
      return;
    }
    setIsSaving(true);
    try {
      if (await isPasswordLeaked(password)) {
        throw new Error('Essa senha já apareceu em vazamentos conhecidos. Escolha outra senha para sua segurança.');
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSaved(true);
    } catch (err) {
      setError(friendlyUpdateError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await supabase.auth.signOut();
    } finally {
      onCancel();
    }
  };

  if (saved) {
    return (
      <AuthCard>
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-center space-y-5"
        >
          <div
            className="mx-auto w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center shadow-md"
            style={{ transform: 'translateZ(40px)' }}
          >
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Senha atualizada!</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Pronto. A partir de agora, use a nova senha para entrar no Hub.
            </p>
          </div>
          <button type="button" onClick={onDone} className={AUTH_PRIMARY_BUTTON_CLASS}>
            Ir para o Hub
          </button>
        </motion.div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div style={{ transform: 'translateZ(30px)' }}>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="w-4 h-4" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
            Criar nova senha
          </h1>
        </div>
        <p className="mt-1 text-[13px] min-[360px]:text-sm sm:text-base text-gray-600 dark:text-gray-400 whitespace-nowrap sm:whitespace-normal">
          Escolha uma senha nova para sua conta.
        </p>
      </div>

      {error && <AuthAlert tone="error">{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="nova-senha" className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-1.5">
            Nova senha
          </label>
          <div className="group relative">
            <Lock className="w-4 h-4 text-gray-500 group-focus-within:text-primary dark:group-focus-within:text-primary-500 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="nova-senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={`Nova senha (mínimo de ${MIN_LENGTH} caracteres)`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${AUTH_INPUT_CLASS} pl-10 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmar-senha"
            className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-1.5"
          >
            Confirmar nova senha
          </label>
          <div className="group relative">
            <Lock className="w-4 h-4 text-gray-500 group-focus-within:text-primary dark:group-focus-within:text-primary-500 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="confirmar-senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`${AUTH_INPUT_CLASS} pl-10 pr-3.5`}
            />
          </div>
        </div>

        <button type="submit" disabled={isSaving || isCancelling} className={AUTH_PRIMARY_BUTTON_CLASS}>
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving || isCancelling}
          className="font-semibold text-primary hover:underline disabled:opacity-60"
        >
          Cancelar e sair
        </button>
      </p>
    </AuthCard>
  );
};
