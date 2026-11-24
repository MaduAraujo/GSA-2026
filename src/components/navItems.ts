import {
  Award,
  BookOpen,
  BarChart3,
  CalendarClock,
  CalendarDays,
  Camera,
  FileText,
  Flag,
  GraduationCap,
  History,
  Headset,
  Link2,
  ScrollText,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { AppPage, AppTab } from '../routes';

export const OFFICIAL_SITE_URL = 'https://amplifica.me/siteembaixadoresestudantis';
export const SUPPORT_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSc3vcViCoOve7lPoFDnglUvktSU9Q5GGjQLr1G4pJAjb7JhKw/viewform';

export type NavGroupId = 'achievements' | 'content' | 'program';

export const NAV_GROUPS: Array<{ id: NavGroupId; label: string; color: string }> = [
  { id: 'achievements', label: 'Conquistas', color: 'text-primary' },
  { id: 'content', label: 'Produção', color: 'text-primary' },
  { id: 'program', label: 'Programa', color: 'text-primary' },
];

export const NAV_ITEMS: Array<{ id: AppTab; label: string; icon: typeof Award; group: NavGroupId }> = [
  { id: 'certificates', label: 'Certificados', icon: Award, group: 'achievements' },
  { id: 'weeklyScore', label: 'Pontuação', icon: Trophy, group: 'achievements' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'achievements' },
  { id: 'posts', label: 'Posts', icon: FileText, group: 'content' },
  { id: 'prompts', label: 'Prompts', icon: Sparkles, group: 'content' },
  { id: 'gallery', label: 'Galeria', icon: Camera, group: 'content' },
  { id: 'referenceLinks', label: 'Referências', icon: Link2, group: 'content' },
  { id: 'sessions', label: 'Sessões', icon: GraduationCap, group: 'program' },
  { id: 'challenges', label: 'Desafios', icon: Flag, group: 'program' },
  { id: 'deadlines', label: 'Prazos', icon: CalendarClock, group: 'program' },
  { id: 'studyGuide', label: 'Grupo de Estudos', icon: BookOpen, group: 'program' },
];

export const groupColor = (group: NavGroupId) => NAV_GROUPS.find((g) => g.id === group)?.color ?? 'text-primary';

export const BOTTOM_NAV_TABS: AppTab[] = ['certificates', 'posts', 'challenges', 'sessions'];

export const PAGE_GROUP_LABEL = 'Informações';

export const PAGE_ITEMS: Array<{ id: AppPage; label: string; icon: typeof Award }> = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'pastSessions', label: 'Acervo de Encontros', icon: History },
  { id: 'guidelines', label: 'Diretrizes', icon: ScrollText },
  { id: 'support', label: 'Suporte', icon: Headset },
];
