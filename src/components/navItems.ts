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

export const NAV_ITEMS: Array<{ id: AppTab; label: string; icon: typeof Award; color: string }> = [
  { id: 'certificates', label: 'Certificados', icon: Award, color: 'text-[#1A73E8]' },
  { id: 'prompts', label: 'Prompts', icon: Sparkles, color: 'text-[#F9AB00]' },
  { id: 'posts', label: 'Posts', icon: FileText, color: 'text-[#EA4335]' },
  { id: 'sessions', label: 'Sessões', icon: GraduationCap, color: 'text-[#34A853]' },
  { id: 'challenges', label: 'Desafios', icon: Flag, color: 'text-[#34A853]' },
  { id: 'gallery', label: 'Galeria', icon: Camera, color: 'text-[#EA4335]' },
  { id: 'weeklyScore', label: 'Pontuação', icon: Trophy, color: 'text-[#F9AB00]' },
  { id: 'referenceLinks', label: 'Referências', icon: Link2, color: 'text-[#1A73E8]' },
  { id: 'deadlines', label: 'Prazos', icon: CalendarClock, color: 'text-[#EA4335]' },
  { id: 'studyGuide', label: 'Grupo de Estudos', icon: BookOpen, color: 'text-[#34A853]' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-[#1A73E8]' },
];

export const PAGE_ITEMS: Array<{ id: AppPage; label: string; icon: typeof Award }> = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'pastSessions', label: 'Acervo de Encontros', icon: History },
  { id: 'guidelines', label: 'Diretrizes', icon: ScrollText },
  { id: 'support', label: 'Suporte', icon: Headset },
];
