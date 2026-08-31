import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import {
  CertificateItem,
  PromptItem,
  GeminiPost,
  AmbassadorProfile,
  UserBadge
} from './types';
import { SupabaseStorageService as StorageService } from './services/supabaseStorage';
import { supabase } from './services/supabaseClient';
import { RemindersService } from './services/reminders';
import { evaluateNewlyEarnedBadges } from './utils/badgeEngine';
import { BadgeDefinition } from './data/badgeCatalog';
import { Navbar, AppTab } from './components/Navbar';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AuthScreen } from './components/AuthScreen';
import { StatsBanner } from './components/StatsBanner';
import { CertificatesModule } from './components/CertificatesModule';
import { PromptsVaultModule } from './components/PromptsVaultModule';
import { GeminiPostsModule } from './components/GeminiPostsModule';
import { GeminiCopilotModule } from './components/GeminiCopilotModule';
import { PwaGuideModal } from './components/PwaGuideModal';
import { ProfileModal } from './components/ProfileModal';
import { BackupModal } from './components/BackupModal';
import { BadgeUnlockToast } from './components/BadgeUnlockToast';
import { usePersistedState, clearPersistedDrafts } from './hooks/usePersistedState';

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

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = usePersistedState<AppTab>(
    'gsa_active_tab',
    'certificates'
  );

  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [posts, setPosts] = useState<GeminiPost[]>([]);
  const [profile, setProfile] = useState<AmbassadorProfile>(EMPTY_PROFILE);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgeToastQueue, setBadgeToastQueue] = useState<BadgeDefinition[]>([]);

  const [draftPostTopic, setDraftPostTopic] = useState<string>('');

  const [isPwaModalOpen, setIsPwaModalOpen] = usePersistedState('gsa_pwa_modal_open', false);
  const [isProfileModalOpen, setIsProfileModalOpen] = usePersistedState('gsa_profile_modal_open', false);
  const [isBackupModalOpen, setIsBackupModalOpen] = usePersistedState('gsa_backup_modal_open', false);

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
        setPosts([]);
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
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [certsData, promptsData, postsData, profData, badgesData] = await Promise.all([
        StorageService.getCertificates(),
        StorageService.getPrompts(),
        StorageService.getPosts(),
        StorageService.getProfile(),
        StorageService.getUserBadges(),
      ]);

      setCertificates(certsData);
      setPrompts(promptsData);
      setPosts(postsData);
      setUserBadges(badgesData);
      if (profData) {
        setProfile(profData);
      }

      const lastPost = [...postsData].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
      RemindersService.checkAndNotify(lastPost?.createdAt || null);

      await syncNewBadges(certsData, promptsData, postsData, badgesData, { silent: true });
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
      for (const badge of earned) {
        await StorageService.unlockBadge(badge.id);
      }
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
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 flex flex-col font-sans selection:bg-blue-600/20 selection:text-blue-600 transition-colors">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenPwaGuide={() => setIsPwaModalOpen(true)}
        onInstallPwa={handleInstallPwa}
        onSignOut={handleSignOut}
        isInstalled={isInstalled}
        hasInstallPrompt={!!deferredPrompt}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
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
          profile={profile}
          onNavigate={(tab) => setActiveTab(tab)}
        />

        <div className="transition-all duration-200 ease-in-out">
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

          <div hidden={activeTab !== 'copilot'}>
            <GeminiCopilotModule />
          </div>

          <div hidden={activeTab !== 'analytics'}>
            <AnalyticsDashboard certificates={certificates} posts={posts} />
          </div>
        </div>
        </>
        )}
      </main>

        <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="font-semibold text-gray-900">Embaixadora Estudantil Google 2026</span>
            <span>• PWA &amp; AI Studio</span>
          </div>

            <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPwaModalOpen(true)}
              className="hover:text-gray-900 underline underline-offset-2 transition-colors"
            >
              Instalar Aplicativo
            </button>
            <span>•</span>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="hover:text-gray-900 underline underline-offset-2 transition-colors"
            >
              Backup &amp; Dados
            </button>
            <span>•</span>
            <span className="font-medium text-gray-800">Desenvolvido com Gemini 3.7</span>
          </div>
        </div>
      </footer>

      <PwaGuideModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstall={handleInstallPwa}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRefreshData={loadAllData}
        profile={profile}
        certificates={certificates}
      />

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