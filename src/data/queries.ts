import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '../app/AuthProvider';
import { SupabaseStorageService as Storage } from '../services/supabaseStorage';
import { EMPTY_PROFILE } from '../services/storage/mappers';
import type {
  AmbassadorProfile,
  AmbassadorSession,
  Certificate,
  Challenge,
  GalleryPhoto,
  HostedEvent,
  LevelBadge,
  ProgramDeadline,
  PromptDoc,
  PromptItem,
  ReferenceLink,
  SessionSummary,
  SocialPost,
  UserBadge,
  WeeklyScore,
} from '../types';

export interface Collections {
  certificates: Certificate[];
  prompts: PromptItem[];
  promptDocs: PromptDoc[];
  posts: SocialPost[];
  challenges: Challenge[];
  galleryPhotos: GalleryPhoto[];
  sessions: AmbassadorSession[];
  weeklyScores: WeeklyScore[];
  referenceLinks: ReferenceLink[];
  deadlines: ProgramDeadline[];
  hostedEvents: HostedEvent[];
  sessionSummaries: SessionSummary[];
  levelBadges: LevelBadge[];
  userBadges: UserBadge[];
}

export type CollectionName = keyof Collections;

const fetchers: { [K in CollectionName]: () => Promise<Collections[K]> } = {
  certificates: () => Storage.getCertificates(),
  prompts: () => Storage.getPrompts(),
  promptDocs: () => Storage.getPromptDocs(),
  posts: () => Storage.getPosts(),
  challenges: () => Storage.getChallenges(),
  galleryPhotos: () => Storage.getGalleryPhotos(),
  sessions: () => Storage.getSessions(),
  weeklyScores: () => Storage.getWeeklyScores(),
  referenceLinks: () => Storage.getReferenceLinks(),
  deadlines: () => Storage.getProgramDeadlines(),
  hostedEvents: () => Storage.getHostedEvents(),
  sessionSummaries: () => Storage.getSessionSummaries(),
  levelBadges: () => Storage.getLevelBadges(),
  userBadges: () => Storage.getUserBadges(),
};

export const queryKeys = {
  user: (userId: string | null) => ['user', userId] as const,
  collection: (userId: string | null, name: CollectionName) => ['user', userId, name] as const,
  profile: (userId: string | null) => ['user', userId, 'profile'] as const,
};

export function useCollection<K extends CollectionName>(name: K) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: queryKeys.collection(userId, name),
    queryFn: fetchers[name] as () => Promise<Collections[K]>,
    enabled: !!userId,
  });
}

export function useCollectionData<K extends CollectionName>(name: K): Collections[K] {
  return (useCollection(name).data ?? []) as Collections[K];
}

export function useProfile() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => Storage.getProfile(),
    enabled: !!userId,
    placeholderData: EMPTY_PROFILE,
  });
}

export function getCollectionData<K extends CollectionName>(
  queryClient: QueryClient,
  userId: string | null,
  name: K,
): Collections[K] {
  return queryClient.getQueryData<Collections[K]>(queryKeys.collection(userId, name)) ?? ([] as Collections[K]);
}

export function useCollectionMutation<TArgs extends unknown[]>(
  invalidates: CollectionName[],
  mutate: (...args: TArgs) => Promise<void>,
  onSaved?: () => Promise<void> | void,
) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: TArgs) => mutate(...args),
    onSuccess: async () => {
      await Promise.all(
        invalidates.map((name) => queryClient.invalidateQueries({ queryKey: queryKeys.collection(userId, name) })),
      );
      await onSaved?.();
    },
  });
  return (...args: TArgs) => mutation.mutateAsync(args);
}

export function useSaveProfile() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (profile: AmbassadorProfile) => Storage.saveProfile(profile),
    onMutate: async (profile) => {
      const key = queryKeys.profile(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<AmbassadorProfile>(key);
      queryClient.setQueryData(key, profile);
      return { previous };
    },
    onError: (_error, _profile, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.profile(userId), context.previous);
    },
  });
  return (profile: AmbassadorProfile) => mutation.mutateAsync(profile);
}
