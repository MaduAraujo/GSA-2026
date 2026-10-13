import { useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { createContext, use, useCallback, useState, type ReactNode } from 'react';
import { BadgeUnlockToast } from '../components/BadgeUnlockToast';
import type { BadgeDefinition } from '../data/badgeCatalog';
import { getCollectionData, queryKeys } from '../data/queries';
import { SupabaseStorageService as Storage } from '../services/supabaseStorage';
import { evaluateNewlyEarnedBadges } from '../utils/badgeEngine';
import { useAuth } from './AuthProvider';

type SyncBadges = (options: { silent: boolean }) => Promise<void>;

const BadgeContext = createContext<SyncBadges | null>(null);

export function BadgeProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [toastQueue, setToastQueue] = useState<BadgeDefinition[]>([]);

  const syncBadges = useCallback<SyncBadges>(
    async ({ silent }) => {
      const earned = evaluateNewlyEarnedBadges(
        getCollectionData(queryClient, userId, 'certificates'),
        getCollectionData(queryClient, userId, 'prompts'),
        getCollectionData(queryClient, userId, 'posts'),
        getCollectionData(queryClient, userId, 'userBadges'),
      );
      if (earned.length === 0) return;

      try {
        await Promise.all(earned.map((badge) => Storage.unlockBadge(badge.id)));
        await queryClient.invalidateQueries({ queryKey: queryKeys.collection(userId, 'userBadges') });

        if (!silent) {
          setToastQueue((prev) => [...prev, ...earned]);
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#1A73E8', '#EA4335', '#FBBC04', '#34A853'],
          });
        }
      } catch (e) {
        console.error('Erro ao registrar badge:', e);
      }
    },
    [queryClient, userId],
  );

  const current = toastQueue[0];

  return (
    <BadgeContext value={syncBadges}>
      {children}
      {current && (
        <BadgeUnlockToast key={current.id} badge={current} onDismiss={() => setToastQueue((prev) => prev.slice(1))} />
      )}
    </BadgeContext>
  );
}

export function useSyncBadges(): SyncBadges {
  const ctx = use(BadgeContext);
  if (!ctx) throw new Error('useSyncBadges must be used inside <BadgeProvider>');
  return ctx;
}
