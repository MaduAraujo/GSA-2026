import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  MailCheck,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Moon,
  Sun,
  Loader2,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AuthScreenProps {
  initialMode?: 'signIn' | 'signUp';
  onBack?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const GoogleRingMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 192 192" className={className}>
    <path d="M 96,16 A 80,80 0 0,1 176,96" fill="none" stroke="#1A73E8" strokeWidth="14" strokeLinecap="round" />
    <path d="M 176,96 A 80,80 0 0,1 96,176" fill="none" stroke="#34A853" strokeWidth="14" strokeLinecap="round" />
    <path d="M 96,176 A 80,80 0 0,1 16,96" fill="none" stroke="#FBBC04" strokeWidth="14" strokeLinecap="round" />
    <path d="M 16,96 A 80,80 0 0,1 96,16" fill="none" stroke="#EA4335" strokeWidth="14" strokeLinecap="round" />
    <path d="M 96 56 L 140 78 L 96 100 L 52 78 Z" fill="#1A73E8" />
    <circle cx="96" cy="120" r="14" fill="#FBBC04" />
  </svg>
);

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'signIn', onBack, isDarkMode, onToggleDarkMode }) => {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'forgotPassword'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const switchMode = (nextMode: 'signIn' | 'signUp' | 'forgotPassword') => {
    setMode(nextMode);
    setError(null);
    setInfoMessage(null);
    setResetSent(false);
  };

  const sendResetEmail = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Não foi possível enviar o link. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    if (mode === 'forgotPassword') {
      await sendResetEmail();
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === 'signIn') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setInfoMessage('Conta criada! Verifique seu e-mail para confirmar o cadastro, se necessário.');
      }
    } catch (err: any) {
      setError(err.message || 'Não foi possível autenticar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <div className="h-1 w-full grid grid-cols-4">
        <div className="bg-blue-600" />
        <div className="bg-red-500" />
        <div className="bg-yellow-500" />
        <div className="bg-green-600" />
      </div>

      <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <GoogleRingMark className="w-8 h-8 shrink-0" />
          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base tracking-tight">
            Hub GSA 2026
          </span>
        </a>
        {onToggleDarkMode && (
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label="Alternar tema"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
      </header>

      <div className="flex items-center justify-center px-4 py-10 sm:py-16">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative w-full max-w-sm"
        >
          <div className="absolute inset-x-6 -top-6 h-24 rounded-full bg-blue-600/10 dark:bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 sm:p-8 space-y-6">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </button>
            )}

            {mode === 'forgotPassword' && resetSent ? (
              <motion.div
                initial={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="text-center space-y-5"
              >
                <div className="mx-auto w-14 h-14 rounded-2xl bg-green-600/10 text-green-600 flex items-center justify-center">
                  <MailCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Verifique seu e-mail</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Enviamos um link de redefinição para <span className="font-semibold text-gray-800 dark:text-gray-200">{email}</span>.
                    Abra o link para criar uma nova senha.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={sendResetEmail}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'Reenviando...' : 'Reenviar e-mail'}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signIn')}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Voltar para o login
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
            <div className="text-center space-y-1">
              <div className="mx-auto w-11 h-11 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                {mode === 'signIn' && <LogIn className="w-5 h-5" />}
                {mode === 'signUp' && <UserPlus className="w-5 h-5" />}
                {mode === 'forgotPassword' && <KeyRound className="w-5 h-5" />}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {mode === 'signIn' && 'Entre para acessar seus dados'}
                {mode === 'signUp' && 'Crie sua conta para começar'}
                {mode === 'forgotPassword' && 'Informe seu e-mail para receber o link de redefinição'}
              </p>
            </div>

            {mode !== 'forgotPassword' && (
              <div className="relative flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
                <motion.div
                  className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-gray-700 shadow-xs"
                  initial={false}
                  animate={{ x: mode === 'signIn' ? 4 : 'calc(100% + 4px)' }}
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
                />
                <button
                  type="button"
                  onClick={() => switchMode('signIn')}
                  className={`relative z-10 flex-1 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                    mode === 'signIn'
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signUp')}
                  className={`relative z-10 flex-1 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                    mode === 'signUp'
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Criar conta
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <div className="group relative">
                  <Mail className="w-4 h-4 text-gray-500 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500 transition-colors absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              {mode !== 'forgotPassword' && (
                <div>
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Senha
                  </label>
                  <div className="group relative">
                    <Lock className="w-4 h-4 text-gray-500 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500 transition-colors absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
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
                  {mode === 'signIn' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgotPassword')}
                      className="mt-1.5 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting
                  ? 'Aguarde...'
                  : mode === 'signIn'
                  ? 'Entrar'
                  : mode === 'signUp'
                  ? 'Criar conta'
                  : 'Enviar'}
              </button>
            </form>

            {mode === 'forgotPassword' && (
              <p className="text-center text-xs text-gray-600 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => switchMode('signIn')}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Voltar para o login
                </button>
              </p>
            )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
