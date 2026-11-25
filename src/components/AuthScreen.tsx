import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Mail, MailCheck, Lock, Eye, EyeOff, ArrowLeft, Loader2, User, KeyRound } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { isPasswordLeaked } from '../utils/passwordSecurity';
import { authErrorCode, friendlyAuthError, isEmailNotConfirmed } from '../lib/authErrors';
import { consumeLinkError } from '../lib/authRedirect';
import { ROUTES } from '../routes';
import { AuthAlert, AuthCard, AUTH_INPUT_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from './auth/AuthCard';

interface AuthScreenProps {
  initialMode?: 'signIn' | 'signUp';
  onBack?: () => void;
}

type Mode = 'signIn' | 'signUp' | 'forgotPassword';

const HEADINGS: Record<Mode, { title: string; subtitle: string }> = {
  signIn: { title: 'Bem-vindo(a) de volta', subtitle: 'Acesse sua jornada de Embaixador(a).' },
  signUp: { title: 'Crie sua conta', subtitle: 'Organize suas conquistas em um só lugar.' },
  forgotPassword: { title: 'Recuperar senha', subtitle: 'Enviaremos um link para o seu e-mail.' },
};

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
    />
  </svg>
);

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'signIn', onBack }) => {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(consumeLinkError);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setInfoMessage(null);
    setResetSent(false);
    setAwaitingConfirmation(false);
    setCanResendConfirmation(false);
    setRecoveryCode('');
  };

  const verifyRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    const token = recoveryCode.replace(/\D/g, '');
    if (token.length < 6) {
      setError('Digite o código de 6 dígitos que enviamos por e-mail.');
      return;
    }
    setIsVerifyingCode(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
      if (verifyError) throw verifyError;
    } catch (err) {
      const code = authErrorCode(err);
      setError(
        code === 'otp_expired' ||
          code === 'otp_invalid' ||
          /expired or is invalid/i.test(String((err as Error)?.message))
          ? 'Código inválido ou expirado. Confira o e-mail mais recente ou peça um novo código.'
          : friendlyAuthError(err, 'Não foi possível validar o código. Tente novamente.'),
      );
      setIsVerifyingCode(false);
    }
  };

  const resendConfirmation = async () => {
    setError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (resendError) throw resendError;
      if (awaitingConfirmation) setInfoMessage('E-mail reenviado. Confira também a caixa de spam.');
      setAwaitingConfirmation(true);
      setCanResendConfirmation(false);
    } catch (err) {
      setError(friendlyAuthError(err, 'Não foi possível reenviar o e-mail. Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendResetEmail = async () => {
    setError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${ROUTES.resetPassword}`,
      });
      if (resetError) throw resetError;
      if (resetSent) setInfoMessage('E-mail reenviado. Confira também a caixa de spam.');
      setResetSent(true);
    } catch (err) {
      setError(friendlyAuthError(err, 'Não foi possível enviar o link. Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setInfoMessage(null);
    setIsGoogleLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(friendlyAuthError(err, 'Não foi possível entrar com o Google. Tente novamente.'));
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setCanResendConfirmation(false);
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
        const name = fullName.trim().replace(/\s+/g, ' ');
        if (!name.includes(' ')) throw new Error('Informe seu nome completo (nome e sobrenome).');
        if (await isPasswordLeaked(password)) {
          throw new Error('Essa senha já apareceu em vazamentos conhecidos. Escolha outra senha para sua segurança.');
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (signUpError) throw signUpError;
        if (data.user && data.user.identities?.length === 0) {
          throw new Error('Já existe uma conta com este e-mail. Entre com sua senha ou use "Esqueceu a senha?".');
        }
        if (!data.session) setAwaitingConfirmation(true);
      }
    } catch (err) {
      if (mode === 'signIn' && isEmailNotConfirmed(err)) setCanResendConfirmation(true);
      setError(friendlyAuthError(err, 'Não foi possível autenticar. Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const heading = HEADINGS[mode];
  const backButton = onBack ? (
    <button
      type="button"
      onClick={onBack}
      aria-label="Voltar"
      title="Voltar"
      className="group w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-xs text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
    </button>
  ) : null;
  const busy = isSubmitting || isGoogleLoading;

  return (
    <AuthCard>
      {awaitingConfirmation || (mode === 'forgotPassword' && resetSent) ? (
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-center space-y-5"
        >
          {backButton && <div className="text-left">{backButton}</div>}
          <div
            className="mx-auto w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center shadow-md"
            style={{ transform: 'translateZ(40px)' }}
          >
            <MailCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {awaitingConfirmation ? 'Confirme seu e-mail' : 'Verifique seu e-mail'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {awaitingConfirmation ? 'Enviamos um link de confirmação para ' : 'Enviamos um código para '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">{email}</span>.{' '}
              {awaitingConfirmation
                ? 'Abra o link para ativar sua conta e entrar no Hub.'
                : 'Digite-o abaixo para criar uma nova senha aqui mesmo.'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Não chegou? Confira a caixa de spam.</p>
          </div>

          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          {infoMessage && <AuthAlert tone="success">{infoMessage}</AuthAlert>}

          {!awaitingConfirmation && (
            <form onSubmit={verifyRecoveryCode} className="space-y-3 text-left">
              <label
                htmlFor="codigo-recuperacao"
                className="block text-sm font-medium text-gray-800 dark:text-gray-300"
              >
                Código de verificação
              </label>
              <div className="group relative">
                <KeyRound className="w-4 h-4 text-gray-500 group-focus-within:text-primary dark:group-focus-within:text-primary-500 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="codigo-recuperacao"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  placeholder="000000"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                  className={`${AUTH_INPUT_CLASS} pl-10 pr-3.5 font-mono tracking-[0.4em]`}
                />
              </div>
              <button type="submit" disabled={isVerifyingCode || isSubmitting} className={AUTH_PRIMARY_BUTTON_CLASS}>
                {isVerifyingCode && <Loader2 className="w-4 h-4 animate-spin" />}
                {isVerifyingCode ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={awaitingConfirmation ? resendConfirmation : sendResetEmail}
              disabled={isSubmitting || isVerifyingCode}
              className={
                awaitingConfirmation
                  ? AUTH_PRIMARY_BUTTON_CLASS
                  : 'w-full h-12 rounded-xl text-base font-semibold text-primary hover:bg-primary/5 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2'
              }
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Reenviando...' : awaitingConfirmation ? 'Reenviar e-mail' : 'Reenviar código'}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signIn')}
              className="w-full h-12 rounded-xl text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Voltar para o login
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          <div style={{ transform: 'translateZ(30px)' }}>
            <div className="flex items-center gap-3">
              {backButton}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                {heading.title}
              </h1>
            </div>
            <p className="mt-1 text-[13px] min-[360px]:text-sm sm:text-base text-gray-600 dark:text-gray-400 whitespace-nowrap sm:whitespace-normal">
              {heading.subtitle}
            </p>
          </div>

          {mode !== 'forgotPassword' && (
            <div className="relative flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-full shadow-inner">
              <motion.div
                className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-gray-700 shadow-sm"
                initial={false}
                animate={{ x: mode === 'signIn' ? 4 : 'calc(100% + 4px)' }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
              />
              {(['signIn', 'signUp'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  aria-pressed={mode === m}
                  className={`relative z-10 flex-1 py-2.5 text-[15px] font-semibold rounded-full transition-colors ${
                    mode === m
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {m === 'signIn' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>
          )}

          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          {canResendConfirmation && (
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={busy}
              className="-mt-2 text-sm font-semibold text-primary hover:underline disabled:opacity-60"
            >
              Reenviar e-mail de confirmação
            </button>
          )}
          {infoMessage && <AuthAlert tone="success">{infoMessage}</AuthAlert>}

          {mode !== 'forgotPassword' && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="w-full h-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-[15px] font-semibold text-gray-800 dark:text-gray-100 shadow-[0_3px_0_0_var(--color-gray-200)] dark:shadow-[0_3px_0_0_var(--color-gray-950)] hover:bg-gray-50 dark:hover:bg-gray-700 hover:translate-y-px active:shadow-none active:translate-y-0.5 transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-3"
              >
                {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon className="w-5 h-5" />}
                {mode === 'signIn' ? 'Entrar com o Google' : 'Cadastrar com o Google'}
              </button>

              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {mode === 'signUp' ? 'ou preencha' : 'ou use seu e-mail'}
                </span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signUp' && (
              <div>
                <label
                  htmlFor="auth-nome"
                  className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-1.5"
                >
                  Nome completo
                </label>
                <div className="group relative">
                  <User className="w-4 h-4 text-gray-500 group-focus-within:text-primary dark:group-focus-within:text-primary-500 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-nome"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Seu nome e sobrenome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`${AUTH_INPUT_CLASS} pl-10 pr-3.5`}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-e-mail"
                className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-1.5"
              >
                E-mail
              </label>
              <div className="group relative">
                <Mail className="w-4 h-4 text-gray-500 group-focus-within:text-primary dark:group-focus-within:text-primary-500 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-e-mail"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${AUTH_INPUT_CLASS} pl-10 pr-3.5`}
                />
              </div>
            </div>

            {mode !== 'forgotPassword' && (
              <div>
                <label
                  htmlFor="auth-senha"
                  className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-1.5"
                >
                  Senha
                </label>
                <div className="group relative">
                  <Lock className="w-4 h-4 text-gray-500 group-focus-within:text-primary dark:group-focus-within:text-primary-500 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-senha"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'signUp' ? 'Senha (mínimo de 6 caracteres)' : 'Sua senha'}
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
                {mode === 'signIn' && (
                  <div className="mt-1.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode('forgotPassword')}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}
              </div>
            )}

            <button type="submit" disabled={busy} className={AUTH_PRIMARY_BUTTON_CLASS}>
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

          {mode !== 'forgotPassword' && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 leading-relaxed text-balance">
              Ao continuar, você aceita os{' '}
              <a href="/termos" className="font-semibold text-primary hover:underline">
                Termos
              </a>{' '}
              e a{' '}
              <a href="/privacidade" className="font-semibold text-primary hover:underline">
                Privacidade
              </a>
              .
            </p>
          )}

          {mode === 'forgotPassword' && (
            <p className="text-center text-xs text-gray-600 dark:text-gray-400">
              <button
                type="button"
                onClick={() => switchMode('signIn')}
                className="font-semibold text-primary hover:underline"
              >
                Voltar para o login
              </button>
            </p>
          )}
        </>
      )}
    </AuthCard>
  );
};
