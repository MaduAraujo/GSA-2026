import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { clearPersistedDrafts } from '../hooks/usePersistedState';
import { setMonitoringUser } from '../lib/monitoring';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  session: Session | null;
  userId: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        queryClient.clear();
        clearPersistedDrafts();
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    setMonitoringUser(userId);
  }, [userId]);

  const value: AuthState = {
    session,
    userId,
    isLoading,
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
