import { Compass, Rocket, Users } from 'lucide-react';

export const LEVEL_MIN_POINTS = [0, 500, 1200] as const;

export const LEVELS = [
  {
    level: 1,
    title: 'Explorador(a)',
    minPoints: LEVEL_MIN_POINTS[0],
    icon: Compass,
    color: 'text-[#1A73E8]',
    bg: 'bg-[#1A73E8]/10',
    description:
      'É quem está descobrindo novas possibilidades com o Google Gemini, experimentando recursos, participando das atividades e construindo repertório para usar IA de forma cada vez mais intencional.',
  },
  {
    level: 2,
    title: 'Expert de Comunidade',
    minPoints: LEVEL_MIN_POINTS[1],
    icon: Users,
    color: 'text-[#34A853]',
    bg: 'bg-[#34A853]/10',
    description:
      'É quem já transforma aprendizado em troca: compartilha descobertas, contribui com outras pessoas e ajuda a movimentar a comunidade com participação e colaboração.',
  },
  {
    level: 3,
    title: 'Catalisador(a)',
    minPoints: LEVEL_MIN_POINTS[2],
    icon: Rocket,
    color: 'text-[#F9AB00]',
    bg: 'bg-[#F9AB00]/10',
    description:
      'É quem amplia o impacto da jornada, mobilizando pessoas, criando iniciativas e levando o uso responsável, crítico e aprofundado do Google Gemini para novos projetos, grupos e espaços da universidade.',
  },
];

export type Level = (typeof LEVELS)[number];

export interface LevelProgress {
  current: Level;
  next: Level | null;
  pointsToNext: number;
  percent: number;
}

export function levelProgress(points: number): LevelProgress {
  const safePoints = Math.max(0, points);
  const index = LEVELS.reduce((found, level, i) => (safePoints >= level.minPoints ? i : found), 0);
  const current = LEVELS[index]!;
  const next = LEVELS[index + 1] ?? null;
  if (!next) return { current, next, pointsToNext: 0, percent: 100 };

  const span = next.minPoints - current.minPoints;
  return {
    current,
    next,
    pointsToNext: next.minPoints - safePoints,
    percent: Math.round(((safePoints - current.minPoints) / span) * 100),
  };
}
