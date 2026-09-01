import {
  Award,
  Star,
  Trophy,
  Clock,
  Layers,
  BookOpen,
  Sparkles,
  Rocket,
  Crown,
  Flame,
  Target,
  Gem,
  Medal,
  type LucideIcon,
} from 'lucide-react';
import { Certificate, PromptItem, GeminiPost } from '../types';
import { sumCertHours } from '../utils/duration';

export interface BadgeStats {
  certificateCount: number;
  totalHours: number;
  categoryCount: number;
  uniqueSkillCount: number;
  favoriteCertCount: number;
  promptCount: number;
  favoritePromptCount: number;
  postCount: number;
  publishedPostCount: number;
}

export function computeBadgeStats(
  certificates: Certificate[],
  prompts: PromptItem[],
  posts: GeminiPost[]
): BadgeStats {
  const categories = new Set(
    certificates.map((c) => c.category?.trim().toLowerCase()).filter(Boolean)
  );
  const skills = new Set(
    certificates.flatMap((c) => c.skills || []).map((s) => s.trim().toLowerCase()).filter(Boolean)
  );

  return {
    certificateCount: certificates.length,
    totalHours: sumCertHours(certificates),
    categoryCount: categories.size,
    uniqueSkillCount: skills.size,
    favoriteCertCount: certificates.filter((c) => c.isFavorite).length,
    promptCount: prompts.length,
    favoritePromptCount: prompts.filter((p) => p.isFavorite).length,
    postCount: posts.length,
    publishedPostCount: posts.filter((p) => p.status === 'Publicado').length,
  };
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'special';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  hint: string;
  icon: LucideIcon;
  tier: BadgeTier;
  isMet: (stats: BadgeStats, unlockedIds: Set<string>) => boolean;
  progress?: (stats: BadgeStats) => { current: number; target: number };
}

const TIER_STYLES: Record<BadgeTier, { bg: string; text: string; ring: string }> = {
  bronze: { bg: 'bg-[#CD7F32]/10', text: 'text-[#CD7F32]', ring: 'ring-[#CD7F32]/30' },
  silver: { bg: 'bg-[#9AA0A6]/15', text: 'text-[#5F6368]', ring: 'ring-[#9AA0A6]/30' },
  gold: { bg: 'bg-[#FBBC04]/15', text: 'text-[#9E5D00]', ring: 'ring-[#FBBC04]/40' },
  special: { bg: 'bg-[#1A73E8]/10', text: 'text-[#1A73E8]', ring: 'ring-[#1A73E8]/30' },
};

export function badgeTierStyle(tier: BadgeTier) {
  return TIER_STYLES[tier];
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'first_certificate',
    name: 'Primeiro Passo',
    description: 'Enviou seu primeiro certificado.',
    hint: 'Envie 1 certificado',
    icon: Award,
    tier: 'bronze',
    isMet: (s) => s.certificateCount >= 1,
    progress: (s) => ({ current: Math.min(s.certificateCount, 1), target: 1 }),
  },
  {
    id: 'five_certificates',
    name: 'Colecionador',
    description: 'Reuniu 5 certificados no seu portfólio.',
    hint: 'Envie 5 certificados',
    icon: Layers,
    tier: 'silver',
    isMet: (s) => s.certificateCount >= 5,
    progress: (s) => ({ current: Math.min(s.certificateCount, 5), target: 5 }),
  },
  {
    id: 'ten_certificates',
    name: 'Mestre das Conquistas',
    description: 'Acumulou 10 certificados.',
    hint: 'Envie 10 certificados',
    icon: Trophy,
    tier: 'gold',
    isMet: (s) => s.certificateCount >= 10,
    progress: (s) => ({ current: Math.min(s.certificateCount, 10), target: 10 }),
  },
  {
    id: 'fifty_hours',
    name: 'Dedicação',
    description: 'Acumulou 50 horas de capacitação.',
    hint: 'Acumule 50h de estudo',
    icon: Clock,
    tier: 'silver',
    isMet: (s) => s.totalHours >= 50,
    progress: (s) => ({ current: Math.min(s.totalHours, 50), target: 50 }),
  },
  {
    id: 'hundred_hours',
    name: 'Centena de Ouro',
    description: 'Acumulou 100 horas de capacitação.',
    hint: 'Acumule 100h de estudo',
    icon: Flame,
    tier: 'gold',
    isMet: (s) => s.totalHours >= 100,
    progress: (s) => ({ current: Math.min(s.totalHours, 100), target: 100 }),
  },
  {
    id: 'five_categories',
    name: 'Multidisciplinar',
    description: 'Tem certificados em 5 categorias diferentes.',
    hint: 'Diversifique em 5 categorias',
    icon: Target,
    tier: 'gold',
    isMet: (s) => s.categoryCount >= 5,
    progress: (s) => ({ current: Math.min(s.categoryCount, 5), target: 5 }),
  },
  {
    id: 'ten_skills',
    name: 'Arsenal de Habilidades',
    description: 'Cadastrou 10 habilidades únicas em seus certificados.',
    hint: 'Cadastre 10 skills únicas',
    icon: Gem,
    tier: 'silver',
    isMet: (s) => s.uniqueSkillCount >= 10,
    progress: (s) => ({ current: Math.min(s.uniqueSkillCount, 10), target: 10 }),
  },
  {
    id: 'first_favorite',
    name: 'Curador',
    description: 'Favoritou seu primeiro certificado.',
    hint: 'Favorite 1 certificado',
    icon: Star,
    tier: 'bronze',
    isMet: (s) => s.favoriteCertCount >= 1,
    progress: (s) => ({ current: Math.min(s.favoriteCertCount, 1), target: 1 }),
  },
  {
    id: 'first_prompt',
    name: 'Explorador de Prompts',
    description: 'Salvou seu primeiro prompt no vault.',
    hint: 'Salve 1 prompt',
    icon: Sparkles,
    tier: 'bronze',
    isMet: (s) => s.promptCount >= 1,
    progress: (s) => ({ current: Math.min(s.promptCount, 1), target: 1 }),
  },
  {
    id: 'ten_prompts',
    name: 'Bibliotecário',
    description: 'Construiu uma biblioteca com 10 prompts salvos.',
    hint: 'Salve 10 prompts',
    icon: BookOpen,
    tier: 'silver',
    isMet: (s) => s.promptCount >= 10,
    progress: (s) => ({ current: Math.min(s.promptCount, 10), target: 10 }),
  },
  {
    id: 'first_post',
    name: 'Voz Ativa',
    description: 'Criou seu primeiro post com o Gemini Posts.',
    hint: 'Crie 1 post',
    icon: Rocket,
    tier: 'bronze',
    isMet: (s) => s.postCount >= 1,
    progress: (s) => ({ current: Math.min(s.postCount, 1), target: 1 }),
  },
  {
    id: 'five_published_posts',
    name: 'Influenciador',
    description: 'Publicou 5 posts nas redes sociais.',
    hint: 'Publique 5 posts',
    icon: Medal,
    tier: 'gold',
    isMet: (s) => s.publishedPostCount >= 5,
    progress: (s) => ({ current: Math.min(s.publishedPostCount, 5), target: 5 }),
  },
  {
    id: 'all_star',
    name: 'Embaixadora Completa',
    description: 'Desbloqueou todas as outras badges do programa.',
    hint: 'Desbloqueie todas as outras badges',
    icon: Crown,
    tier: 'special',
    isMet: (_s, unlockedIds) => {
      const others = BADGE_CATALOG.filter((b) => b.id !== 'all_star');
      return others.every((b) => unlockedIds.has(b.id));
    },
    progress: (_s) => {
      return { current: 0, target: BADGE_CATALOG.length - 1 };
    },
  },
];