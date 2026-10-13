import { useQueryClient } from '@tanstack/react-query';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { StatsBanner } from '../components/StatsBanner';
import { consolidateDuplicateChallengePosts } from '../data/consolidateChallengePosts';
import { queryKeys, useCollection, useCollectionData, useProfile, useSaveProfile } from '../data/queries';
import { usePersistedState } from '../hooks/usePersistedState';
import {
  pageFromPath,
  readLastTab,
  rememberLastTab,
  TAB_PATHS,
  tabFromPath,
  type AppPage,
  type AppTab,
} from '../routes';
import { RemindersService } from '../services/reminders';
import { EMPTY_PROFILE } from '../services/storage/mappers';
import { useAuth } from './AuthProvider';
import { useSyncBadges } from './BadgeProvider';
import { TabSkeleton } from './tabs/TabSkeleton';

const TAB_COMPONENTS: Record<AppTab, LazyExoticComponent<ComponentType>> = {
  certificates: lazy(() => import('./tabs/CertificatesTab')),
  prompts: lazy(() => import('./tabs/PromptsTab')),
  posts: lazy(() => import('./tabs/PostsTab')),
  sessions: lazy(() => import('./tabs/SessionsTab')),
  challenges: lazy(() => import('./tabs/ChallengesTab')),
  gallery: lazy(() => import('./tabs/GalleryTab')),
  weeklyScore: lazy(() => import('./tabs/WeeklyScoreTab')),
  referenceLinks: lazy(() => import('./tabs/ReferenceLinksTab')),
  deadlines: lazy(() => import('./tabs/DeadlinesTab')),
  studyGuide: lazy(() => import('./tabs/StudyGuideTab')),
  analytics: lazy(() => import('./tabs/AnalyticsTab')),
};

const ProfileModal = lazy(() => import('../components/ProfileModal').then((m) => ({ default: m.ProfileModal })));
const AmbassadorAreaModal = lazy(() =>
  import('../components/AmbassadorAreaModal').then((m) => ({ default: m.AmbassadorAreaModal })),
);
const SettingsModal = lazy(() => import('../components/SettingsModal').then((m) => ({ default: m.SettingsModal })));

const PAGE_COMPONENTS: Record<AppPage, LazyExoticComponent<ComponentType>> = {
  guidelines: lazy(() => import('../components/GuidelinesPage').then((m) => ({ default: m.GuidelinesPage }))),
  support: lazy(() => import('../components/SupportPage').then((m) => ({ default: m.SupportPage }))),
};

function PageView({ page }: { page: AppPage }) {
  const PageComponent = PAGE_COMPONENTS[page];
  return <PageComponent />;
}

interface AppShellProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

function useDataMaintenance() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const syncBadges = useSyncBadges();
  const certificates = useCollection('certificates');
  const prompts = useCollection('prompts');
  const posts = useCollection('posts');
  const challenges = useCollection('challenges');
  const userBadges = useCollection('userBadges');
  const doneForUser = useRef<string | null>(null);

  const ready =
    certificates.isSuccess && prompts.isSuccess && posts.isSuccess && challenges.isSuccess && userBadges.isSuccess;

  useEffect(() => {
    if (!ready || !userId || doneForUser.current === userId) return;
    doneForUser.current = userId;

    void (async () => {
      const changed = await consolidateDuplicateChallengePosts(challenges.data, posts.data);
      if (changed) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.collection(userId, 'posts') }),
          queryClient.invalidateQueries({ queryKey: queryKeys.collection(userId, 'challenges') }),
        ]);
      }

      const lastPost = [...posts.data].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
      RemindersService.checkAndNotify(lastPost?.createdAt || null);

      await syncBadges({ silent: true });
    })();
  }, [ready, userId, challenges.data, posts.data, queryClient, syncBadges]);
}

export function AppShell({ isDarkMode, onToggleDarkMode }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = tabFromPath(location.pathname);
  const activePage = pageFromPath(location.pathname);
  const { signOut } = useAuth();
  const profileQuery = useProfile();
  const saveProfile = useSaveProfile();

  const certificates = useCollection('certificates');
  const prompts = useCollectionData('prompts');
  const posts = useCollectionData('posts');
  const challenges = useCollectionData('challenges');
  const sessions = useCollectionData('sessions');

  const [visitedTabs, setVisitedTabs] = useState<Set<AppTab>>(() => new Set(activeTab ? [activeTab] : []));
  if (activeTab && !visitedTabs.has(activeTab)) {
    setVisitedTabs(new Set(visitedTabs).add(activeTab));
  }

  useEffect(() => {
    if (activeTab) rememberLastTab(activeTab);
  }, [activeTab]);

  const [isProfileModalOpen, setIsProfileModalOpen] = usePersistedState('gsa_profile_modal_open', false);
  const [isAmbassadorAreaOpen, setIsAmbassadorAreaOpen] = usePersistedState('gsa_ambassador_area_open', false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = usePersistedState('gsa_settings_modal_open', false);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);

  useDataMaintenance();

  if (!activeTab && !activePage) {
    return <Navigate to={TAB_PATHS[readLastTab()]} replace />;
  }

  const isInitialLoad = (profileQuery.isPlaceholderData && profileQuery.isFetching) || certificates.isPending;
  const currentProfile = profileQuery.data ?? EMPTY_PROFILE;

  return (
    <div className="min-h-screen md:h-dvh md:overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 flex flex-col font-sans selection:bg-blue-600/20 selection:text-blue-600 transition-colors">
      <Navbar
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={() => setIsMobileNavOpen((v) => !v)}
        profile={currentProfile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAmbassadorArea={() => setIsAmbassadorAreaOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onSignOut={signOut}
      />

      <div className="flex flex-1 md:min-h-0">
        <Sidebar
          activeTab={activeTab}
          activePage={activePage}
          mobileOpen={isMobileNavOpen}
          onMobileClose={closeMobileNav}
        />

        <div id="app-scroll" className="flex-1 min-w-0 flex flex-col md:overflow-y-auto md:overscroll-contain">
          <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {isInitialLoad ? (
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
                {activePage && (
                  <Suspense fallback={<TabSkeleton />}>
                    <PageView page={activePage} />
                  </Suspense>
                )}

                {!activePage && (
                  <StatsBanner
                    certificates={certificates.data ?? []}
                    prompts={prompts}
                    posts={posts}
                    challenges={challenges}
                    sessions={sessions}
                    profile={currentProfile}
                    onNavigate={(tab) => navigate(TAB_PATHS[tab])}
                  />
                )}

                {[...visitedTabs].map((tab) => {
                  const TabComponent = TAB_COMPONENTS[tab];
                  return (
                    <div key={tab} hidden={tab !== activeTab}>
                      <Suspense fallback={<TabSkeleton />}>
                        <TabComponent />
                      </Suspense>
                    </div>
                  );
                })}
              </>
            )}
          </main>

          <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
              <p className="text-center">
                © 2026 Embaixadores Estudantis do Google.
                <br className="sm:hidden" /> Todos os direitos reservados.
              </p>
            </div>
          </footer>
        </div>
      </div>

      <Suspense fallback={null}>
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={currentProfile}
          onSaveProfile={saveProfile}
        />
        <AmbassadorAreaModal
          isOpen={isAmbassadorAreaOpen}
          onClose={() => setIsAmbassadorAreaOpen(false)}
          profile={currentProfile}
          onSaveProfile={saveProfile}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      </Suspense>
    </div>
  );
}
