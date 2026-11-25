import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { clearPersistedDrafts } from '../hooks/usePersistedState';
import { arrivedFromRecoveryLink, clearAuthParamsFromUrl, markLinkError, recoveryTokenHash } from '../lib/authRedirect';
import { setMonitoringUser } from '../lib/monitoring';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  session: Session | null;
  userId: string | null;
  isLoading: boolean;
  isRecovery: boolean;
  completeRecovery: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

let recoveryVerification: Promise<boolean> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(arrivedFromRecoveryLink);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (recoveryTokenHash) {
        recoveryVerification ??= supabase.auth
          .verifyOtp({ token_hash: recoveryTokenHash, type: 'recovery' })
          .then(({ error }) => {
            if (error) {
              markLinkError();
              return false;
            }
            clearAuthParamsFromUrl();
            return true;
          });
        const verified = await recoveryVerification;
        if (!cancelled) setIsRecovery(verified);
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      setIsLoading(false);
    };
    void init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
      if (!newSession) {
        setIsRecovery(false);
        queryClient.clear();
        clearPersistedDrafts();
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    setMonitoringUser(userId);
  }, [userId]);

  const value: AuthState = {
    session,
    userId,
    isLoading,
    isRecovery,
    completeRecovery: () => setIsRecovery(false),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
