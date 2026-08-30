import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto w-11 h-11 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
            {mode === 'signIn' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <h1 className="text-lg font-bold text-gray-900">Embaixadora Google 2026</h1>
          <p className="text-xs text-gray-600">
            {mode === 'signIn' ? 'Entre para acessar seus dados' : 'Crie sua conta para começar'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-xs font-semibold text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Aguarde...' : mode === 'signIn' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600">
          {mode === 'signIn' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setError(null);
              setInfoMessage(null);
            }}
            className="font-semibold text-blue-600 hover:underline"
          >
            {mode === 'signIn' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  );
};
