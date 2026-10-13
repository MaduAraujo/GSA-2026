export type AppTab =
  | 'certificates'
  | 'prompts'
  | 'posts'
  | 'sessions'
  | 'challenges'
  | 'gallery'
  | 'weeklyScore'
  | 'referenceLinks'
  | 'deadlines'
  | 'studyGuide'
  | 'analytics';

export const TAB_PATHS: Record<AppTab, string> = {
  certificates: '/certificados',
  prompts: '/prompts',
  posts: '/posts',
  sessions: '/sessoes',
  challenges: '/desafios',
  gallery: '/galeria',
  weeklyScore: '/pontuacao',
  referenceLinks: '/referencias',
  deadlines: '/prazos',
  studyGuide: '/grupo-de-estudos',
  analytics: '/analytics',
};

export const DEFAULT_TAB: AppTab = 'certificates';

export const ROUTES = {
  home: '/',
  signIn: '/entrar',
  signUp: '/cadastro',
  about: '/sobre',
  portfolio: '/p/:slug',
  support: '/suporte',
  guidelines: '/diretrizes',
} as const;

export type AppPage = 'guidelines' | 'support';

export const PAGE_PATHS: Record<AppPage, string> = {
  guidelines: ROUTES.guidelines,
  support: ROUTES.support,
};

const normalizePath = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname);

const PATH_TO_PAGE = new Map(Object.entries(PAGE_PATHS).map(([page, path]) => [path, page as AppPage]));

export function pageFromPath(pathname: string): AppPage | null {
  return PATH_TO_PAGE.get(normalizePath(pathname)) ?? null;
}

const PATH_TO_TAB = new Map(Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as AppTab]));

export function tabFromPath(pathname: string): AppTab | null {
  return PATH_TO_TAB.get(normalizePath(pathname)) ?? null;
}

const LAST_TAB_KEY = 'gsa_active_tab';

export function readLastTab(): AppTab {
  try {
    const raw = localStorage.getItem(LAST_TAB_KEY);
    const tab = raw ? (JSON.parse(raw) as string) : null;
    return tab && tab in TAB_PATHS ? (tab as AppTab) : DEFAULT_TAB;
  } catch {
    return DEFAULT_TAB;
  }
}

export function rememberLastTab(tab: AppTab) {
  try {
    localStorage.setItem(LAST_TAB_KEY, JSON.stringify(tab));
  } catch {}
}
