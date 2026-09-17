import React, { useState, useEffect, Suspense, lazy } from 'react';
import type { Session } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import {
  CertificateItem,
  PromptItem,
  PromptDoc,
  GeminiPost,
  AmbassadorProfile,
  UserBadge,
  Challenge,
  GalleryPhoto,
  AmbassadorSession,
  WeeklyScore,
  ReferenceLink,
  ProgramDeadline
} from './types';
import { SupabaseStorageService as StorageService } from './services/supabaseStorage';
import { supabase } from './services/supabaseClient';
import { RemindersService } from './services/reminders';
import { evaluateNewlyEarnedBadges } from './utils/badgeEngine';
import { BadgeDefinition } from './data/badgeCatalog';
import { Navbar, AppTab } from './components/Navbar';
import { StatsBanner } from './components/StatsBanner';
import { BadgeUnlockToast } from './components/BadgeUnlockToast';
import { usePersistedState, useLocalPersistedState, clearPersistedDrafts } from './hooks/usePersistedState';

const HomePage = lazy(() => import('./components/HomePage').then((m) => ({ default: m.HomePage })));
const AuthScreen = lazy(() => import('./components/AuthScreen').then((m) => ({ default: m.AuthScreen })));
const CertificatesModule = lazy(() => import('./components/CertificatesModule').then((m) => ({ default: m.CertificatesModule })));
const PromptsVaultModule = lazy(() => import('./components/PromptsVaultModule').then((m) => ({ default: m.PromptsVaultModule })));
const GeminiPostsModule = lazy(() => import('./components/GeminiPostsModule').then((m) => ({ default: m.GeminiPostsModule })));
const ChallengesModule = lazy(() => import('./components/ChallengesModule').then((m) => ({ default: m.ChallengesModule })));
const GalleryModule = lazy(() => import('./components/GalleryModule').then((m) => ({ default: m.GalleryModule })));
const SessionsModule = lazy(() => import('./components/SessionsModule').then((m) => ({ default: m.SessionsModule })));
const WeeklyScoreModule = lazy(() => import('./components/WeeklyScoreModule').then((m) => ({ default: m.WeeklyScoreModule })));
const ReferenceLinksModule = lazy(() => import('./components/ReferenceLinksModule').then((m) => ({ default: m.ReferenceLinksModule })));
const DeadlinesModule = lazy(() => import('./components/DeadlinesModule').then((m) => ({ default: m.DeadlinesModule })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard })));
const ProfileModal = lazy(() => import('./components/ProfileModal').then((m) => ({ default: m.ProfileModal })));
const AmbassadorAreaModal = lazy(() => import('./components/AmbassadorAreaModal').then((m) => ({ default: m.AmbassadorAreaModal })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal })));

const DATA_CACHE_KEY_PREFIX = 'gsa_data_cache_v4_';

interface CachedAppData {
  certificates: CertificateItem[];
  prompts: PromptItem[];
  promptDocs: PromptDoc[];
  posts: GeminiPost[];
  challenges: Challenge[];
  galleryPhotos: GalleryPhoto[];
  sessions: AmbassadorSession[];
  weeklyScores: WeeklyScore[];
  referenceLinks: ReferenceLink[];
  deadlines: ProgramDeadline[];
  userBadges: UserBadge[];
  profile: AmbassadorProfile;
}

function readCachedAppData(userId: string): CachedAppData | null {
  try {
    const raw = localStorage.getItem(DATA_CACHE_KEY_PREFIX + userId);
    return raw ? (JSON.parse(raw) as CachedAppData) : null;
  } catch {
    return null;
  }
}

function writeCachedAppData(userId: string, data: CachedAppData): void {
  try {
    localStorage.setItem(DATA_CACHE_KEY_PREFIX + userId, JSON.stringify(data));
  } catch {}
}

const EMPTY_PROFILE: AmbassadorProfile = {
  name: '',
  role: '',
  university: '',
  course: '',
  avatarUrl: '',
  bio: '',
  email: '',
  goal2026: '',
};

async function consolidateDuplicateChallengePosts(
  challenges: Challenge[],
  posts: GeminiPost[]
): Promise<{ challenges: Challenge[]; posts: GeminiPost[] }> {
  let nextChallenges = challenges;
  let nextPosts = posts;

  for (const challenge of challenges) {
    const linkedIds = challenge.linkedPostIds && challenge.linkedPostIds.length > 0
      ? challenge.linkedPostIds
      : challenge.linkedPostId
      ? [challenge.linkedPostId]
      : [];
    if (linkedIds.length <= 1) continue;

    const linkedPosts = linkedIds
      .map((id) => nextPosts.find((p) => p.id === id))
      .filter((p): p is GeminiPost => !!p);
    if (linkedPosts.length <= 1) continue;

    const survivor = linkedPosts[0];
    const staleIds = linkedPosts.slice(1).map((p) => p.id);

    const socialLinks = challenge.socialLinks && challenge.socialLinks.length > 0
      ? challenge.socialLinks
      : linkedPosts
          .filter((p) => p.publishedUrl)
          .map((p) => ({ id: crypto.randomUUID(), platform: p.platform, link: p.publishedUrl as string }));

    const mergedPost: GeminiPost = {
      ...survivor,
      platform: socialLinks[0]?.platform || survivor.platform,
      publishedUrl: socialLinks[0]?.link || survivor.publishedUrl,
      socialLinks,
      updatedAt: new Date().toISOString(),
    };

    const mergedChallenge: Challenge = {
      ...challenge,
      linkedPostId: survivor.id,
      linkedPostIds: [survivor.id],
      socialLinks,
      resultLink: socialLinks[0]?.link,
      resultPlatform: socialLinks[0]?.platform,
      updatedAt: new Date().toISOString(),
    };

    try {
      await StorageService.savePost(mergedPost);
      for (const staleId of staleIds) {
        await StorageService.deletePost(staleId);
      }
      await StorageService.saveChallenge(mergedChallenge);

      nextPosts = nextPosts.filter((p) => !staleIds.includes(p.id)).map((p) => (p.id === survivor.id ? mergedPost : p));
      nextChallenges = nextChallenges.map((c) => (c.id === challenge.id ? mergedChallenge : c));
    } catch (e) {
      console.error('Falha ao consolidar posts duplicados do desafio', challenge.id, e);
    }
  }

  return { challenges: nextChallenges, posts: nextPosts };
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<'home' | 'signIn' | 'signUp'>('home');
  const [activeTab, setActiveTab] = useLocalPersistedState<AppTab>(
    'gsa_active_tab',
    'certificates'
  );

  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [promptDocs, setPromptDocs] = useState<PromptDoc[]>([]);
  const [posts, setPosts] = useState<GeminiPost[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [sessions, setSessions] = useState<AmbassadorSession[]>([]);
  const [weeklyScores, setWeeklyScores] = useState<WeeklyScore[]>([]);
  const [referenceLinks, setReferenceLinks] = useState<ReferenceLink[]>([]);
  const [deadlines, setDeadlines] = useState<ProgramDeadline[]>([]);
  const [profile, setProfile] = useState<AmbassadorProfile>(EMPTY_PROFILE);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgeToastQueue, setBadgeToastQueue] = useState<BadgeDefinition[]>([]);

  const [draftPostTopic, setDraftPostTopic] = useState<string>('');

  const [isPwaModalOpen, setIsPwaModalOpen] = usePersistedState('gsa_pwa_modal_open', false);
  const [isProfileModalOpen, setIsProfileModalOpen] = usePersistedState('gsa_profile_modal_open', false);
  const [isAmbassadorAreaOpen, setIsAmbassadorAreaOpen] = usePersistedState('gsa_ambassador_area_open', false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = usePersistedState('gsa_settings_modal_open', false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('google_ambassador_dark_mode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('google_ambassador_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const handleToggleDarkMode = () => setIsDarkMode((prev) => !prev);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setCertificates([]);
        setPrompts([]);
        setPromptDocs([]);
        setPosts([]);
        setChallenges([]);
        setGalleryPhotos([]);
        setSessions([]);
        setWeeklyScores([]);
        setReferenceLinks([]);
        setDeadlines([]);
        setProfile(EMPTY_PROFILE);
        setUserBadges([]);
        setBadgeToastQueue([]);
        clearPersistedDrafts();
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  useEffect(() => {
    if (session) {
      loadAllData();
    }
  }, [session?.user?.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const loadAllData = async () => {
    const userId = session?.user?.id;
    const cached = userId ? readCachedAppData(userId) : null;

    if (cached) {
      setCertificates(cached.certificates);
      setPrompts(cached.prompts);
      setPromptDocs(cached.promptDocs);
      setPosts(cached.posts);
      setChallenges(cached.challenges);
      setGalleryPhotos(cached.galleryPhotos);
      setSessions(cached.sessions);
      setWeeklyScores(cached.weeklyScores);
      setReferenceLinks(cached.referenceLinks);
      setDeadlines(cached.deadlines);
      setUserBadges(cached.userBadges);
      setProfile(cached.profile);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      const [certsData, promptsData, promptDocsData, rawPostsData, rawChallengesData, galleryData, sessionsData, weeklyScoresData, referenceLinksData, deadlinesData, profData, badgesData] = await Promise.all([
        StorageService.getCertificates(),
        StorageService.getPrompts(),
        StorageService.getPromptDocs(),
        StorageService.getPosts(),
        StorageService.getChallenges(),
        StorageService.getGalleryPhotos(),
        StorageService.getSessions(),
        StorageService.getWeeklyScores(),
        StorageService.getReferenceLinks(),
        StorageService.getProgramDeadlines(),
        StorageService.getProfile(),
        StorageService.getUserBadges(),
      ]);

      const { challenges: challengesData, posts: postsData } = await consolidateDuplicateChallengePosts(
        rawChallengesData,
        rawPostsData
      );

      setCertificates(certsData);
      setPrompts(promptsData);
      setPromptDocs(promptDocsData);
      setPosts(postsData);
      setChallenges(challengesData);
      setGalleryPhotos(galleryData);
      setSessions(sessionsData);
      setWeeklyScores(weeklyScoresData);
      setReferenceLinks(referenceLinksData);
      setDeadlines(deadlinesData);
      setUserBadges(badgesData);
      if (profData) {
        setProfile(profData);
      }

      if (userId) {
        writeCachedAppData(userId, {
          certificates: certsData,
          prompts: promptsData,
          promptDocs: promptDocsData,
          posts: postsData,
          challenges: challengesData,
          galleryPhotos: galleryData,
          sessions: sessionsData,
          weeklyScores: weeklyScoresData,
          referenceLinks: referenceLinksData,
          deadlines: deadlinesData,
          userBadges: badgesData,
          profile: profData ?? profile,
        });
      }

      const lastPost = [...postsData].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
      RemindersService.checkAndNotify(lastPost?.createdAt || null);

      syncNewBadges(certsData, promptsData, postsData, badgesData, { silent: true });
    } catch (e) {
      console.error('Erro ao carregar dados do armazenamento:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const syncNewBadges = async (
    certsData: CertificateItem[],
    promptsData: PromptItem[],
    postsData: GeminiPost[],
    currentBadges: UserBadge[],
    { silent }: { silent: boolean }
  ) => {
    const earned = evaluateNewlyEarnedBadges(certsData, promptsData, postsData, currentBadges);
    if (earned.length === 0) return;

    try {
      await Promise.all(earned.map((badge) => StorageService.unlockBadge(badge.id)));
      const refreshed = await StorageService.getUserBadges();
      setUserBadges(refreshed);

      if (!silent) {
        setBadgeToastQueue((prev) => [...prev, ...earned]);
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
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setIsPwaModalOpen(true);
    }
  };

  const handleSaveCertificate = async (cert: CertificateItem) => {
    await StorageService.saveCertificate(cert);
    const updated = await StorageService.getCertificates();
    setCertificates(updated);
    await syncNewBadges(updated, prompts, posts, userBadges, { silent: false });
  };

  const handleDeleteCertificate = async (id: string) => {
    await StorageService.deleteCertificate(id);
    const updated = await StorageService.getCertificates();
    setCertificates(updated);
  };

  const handleCreatePostFromCert = (cert: CertificateItem) => {
    setDraftPostTopic(`Conquista do certificado oficial: "${cert.title}" emitido por ${cert.issuer}`);
    setActiveTab('posts');
  };

  const handleSavePrompt = async (prompt: PromptItem) => {
    await StorageService.savePrompt(prompt);
    const updated = await StorageService.getPrompts();
    setPrompts(updated);
    await syncNewBadges(certificates, updated, posts, userBadges, { silent: false });
  };

  const handleDeletePrompt = async (id: string) => {
    await StorageService.deletePrompt(id);
    const updated = await StorageService.getPrompts();
    setPrompts(updated);
  };

  const handleSavePromptDoc = async (doc: PromptDoc) => {
    await StorageService.savePromptDoc(doc);
    const updated = await StorageService.getPromptDocs();
    setPromptDocs(updated);
  };

  const handleDeletePromptDoc = async (id: string) => {
    await StorageService.deletePromptDoc(id);
    const updated = await StorageService.getPromptDocs();
    setPromptDocs(updated);
  };

  const handleSavePost = async (post: GeminiPost) => {
    await StorageService.savePost(post);
    const updated = await StorageService.getPosts();
    setPosts(updated);
    await syncNewBadges(certificates, prompts, updated, userBadges, { silent: false });
  };

  const handleDeletePost = async (id: string) => {
    await StorageService.deletePost(id);
    const updated = await StorageService.getPosts();
    setPosts(updated);
  };

  const handleSaveChallenge = async (challenge: Challenge, resultVideoFile?: File) => {
    await StorageService.saveChallenge(challenge, resultVideoFile);
    const updated = await StorageService.getChallenges();
    setChallenges(updated);
  };

  const handleDeleteChallenge = async (id: string) => {
    await StorageService.deleteChallenge(id);
    const updated = await StorageService.getChallenges();
    setChallenges(updated);
  };

  const handleSaveGalleryPhoto = async (photo: GalleryPhoto, videoFile?: File) => {
    await StorageService.saveGalleryPhoto(photo, videoFile);
    const updated = await StorageService.getGalleryPhotos();
    setGalleryPhotos(updated);
  };

  const handleDeleteGalleryPhoto = async (id: string) => {
    await StorageService.deleteGalleryPhoto(id);
    const updated = await StorageService.getGalleryPhotos();
    setGalleryPhotos(updated);
  };

  const handleSaveSession = async (session: AmbassadorSession, proofVideoFile?: File) => {
    await StorageService.saveSession(session, proofVideoFile);
    const updated = await StorageService.getSessions();
    setSessions(updated);
  };

  const handleDeleteSession = async (id: string) => {
    await StorageService.deleteSession(id);
    const updated = await StorageService.getSessions();
    setSessions(updated);
  };

  const handleSaveWeeklyScore = async (weeklyScore: WeeklyScore) => {
    await StorageService.saveWeeklyScore(weeklyScore);
    const updated = await StorageService.getWeeklyScores();
    setWeeklyScores(updated);
  };

  const handleDeleteWeeklyScore = async (id: string) => {
    await StorageService.deleteWeeklyScore(id);
    const updated = await StorageService.getWeeklyScores();
    setWeeklyScores(updated);
  };

  const handleSaveReferenceLink = async (referenceLink: ReferenceLink) => {
    await StorageService.saveReferenceLink(referenceLink);
    const updated = await StorageService.getReferenceLinks();
    setReferenceLinks(updated);
  };

  const handleDeleteReferenceLink = async (id: string) => {
    await StorageService.deleteReferenceLink(id);
    const updated = await StorageService.getReferenceLinks();
    setReferenceLinks(updated);
  };

  const handleSaveDeadline = async (deadline: ProgramDeadline) => {
    await StorageService.saveProgramDeadline(deadline);
    const updated = await StorageService.getProgramDeadlines();
    setDeadlines(updated);
  };

  const handleDeleteDeadline = async (id: string) => {
    await StorageService.deleteProgramDeadline(id);
    const updated = await StorageService.getProgramDeadlines();
    setDeadlines(updated);
  };

  const handleSaveProfile = async (newProfile: AmbassadorProfile) => {
    setProfile(newProfile);
    await StorageService.saveProfile(newProfile);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse text-sm text-gray-600">Carregando...</div>
        </div>
    );
  }

  if (!session) {
    if (authView === 'home') {
      return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
          <HomePage
            onLogin={() => setAuthView('signIn')}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            deferredPrompt={deferredPrompt}
            onInstallPwa={handleInstallPwa}
            isPwaModalOpen={isPwaModalOpen}
            onClosePwaModal={() => setIsPwaModalOpen(false)}
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <AuthScreen
          initialMode={authView}
          onBack={() => setAuthView('home')}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 flex flex-col font-sans selection:bg-blue-600/20 selection:text-blue-600 transition-colors">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAmbassadorArea={() => setIsAmbassadorAreaOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6 animate-pulse" role="status" aria-label="Carregando seus dados">
            <div className="h-40 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
            <div className="h-14 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="h-64 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
              <div className="h-64 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
              <div className="h-64 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
            </div>
          </div>
        ) : (
        <>
        <StatsBanner
          certificates={certificates}
          prompts={prompts}
          posts={posts}
          challenges={challenges}
          sessions={sessions}
          profile={profile}
          onNavigate={(tab) => setActiveTab(tab)}
        />

        <div className="transition-all duration-200 ease-in-out">
        <Suspense
          fallback={
            <div className="h-64 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse" />
          }
        >
          <div hidden={activeTab !== 'certificates'}>
            <CertificatesModule
              certificates={certificates}
              prompts={prompts}
              posts={posts}
              userBadges={userBadges}
              profile={profile}
              onSaveCertificate={handleSaveCertificate}
              onDeleteCertificate={handleDeleteCertificate}
              onCreatePostFromCertificate={handleCreatePostFromCert}
            />
          </div>

          <div hidden={activeTab !== 'prompts'}>
            <PromptsVaultModule
              prompts={prompts}
              onSavePrompt={handleSavePrompt}
              onDeletePrompt={handleDeletePrompt}
              promptDocs={promptDocs}
              onSavePromptDoc={handleSavePromptDoc}
              onDeletePromptDoc={handleDeletePromptDoc}
            />
          </div>

          <div hidden={activeTab !== 'posts'}>
            <GeminiPostsModule
              posts={posts}
              onSavePost={handleSavePost}
              onDeletePost={handleDeletePost}
              initialDraftTopic={draftPostTopic}
            />
          </div>

          <div hidden={activeTab !== 'sessions'}>
            <SessionsModule
              sessions={sessions}
              onSaveSession={handleSaveSession}
              onDeleteSession={handleDeleteSession}
            />
          </div>

          <div hidden={activeTab !== 'challenges'}>
            <ChallengesModule
              challenges={challenges}
              posts={posts}
              onSaveChallenge={handleSaveChallenge}
              onDeleteChallenge={handleDeleteChallenge}
              onSavePost={handleSavePost}
              onDeletePost={handleDeletePost}
            />
          </div>

          <div hidden={activeTab !== 'gallery'}>
            <GalleryModule
              photos={galleryPhotos}
              onSavePhoto={handleSaveGalleryPhoto}
              onDeletePhoto={handleDeleteGalleryPhoto}
            />
          </div>

          <div hidden={activeTab !== 'weeklyScore'}>
            <WeeklyScoreModule
              weeklyScores={weeklyScores}
              onSaveWeeklyScore={handleSaveWeeklyScore}
              onDeleteWeeklyScore={handleDeleteWeeklyScore}
            />
          </div>

          <div hidden={activeTab !== 'referenceLinks'}>
            <ReferenceLinksModule
              referenceLinks={referenceLinks}
              onSaveReferenceLink={handleSaveReferenceLink}
              onDeleteReferenceLink={handleDeleteReferenceLink}
            />
          </div>

          <div hidden={activeTab !== 'deadlines'}>
            <DeadlinesModule
              deadlines={deadlines}
              onSaveDeadline={handleSaveDeadline}
              onDeleteDeadline={handleDeleteDeadline}
            />
          </div>

          <div hidden={activeTab !== 'analytics'}>
            <AnalyticsDashboard certificates={certificates} posts={posts} sessions={sessions} challenges={challenges} />
          </div>
        </Suspense>
        </div>
        </>
        )}
      </main>

        <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
            <p className="text-center">© 2026 Embaixadores Estudantis do Google.<br className="sm:hidden" /> Todos os direitos reservados.</p>
          </div>
        </footer>

      <Suspense fallback={null}>
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={profile}
          onSaveProfile={handleSaveProfile}
        />

        <AmbassadorAreaModal
          isOpen={isAmbassadorAreaOpen}
          onClose={() => setIsAmbassadorAreaOpen(false)}
          profile={profile}
          onSaveProfile={handleSaveProfile}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      </Suspense>

      {badgeToastQueue[0] && (
        <BadgeUnlockToast
          key={badgeToastQueue[0].id}
          badge={badgeToastQueue[0]}
          onDismiss={() => setBadgeToastQueue((prev) => prev.slice(1))}
        />
      )}

    </div>
  );
}