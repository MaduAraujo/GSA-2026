import {
  AmbassadorProfile,
  AmbassadorSession,
  Certificate,
  Challenge,
  GeminiPost,
  PromptItem,
  WeeklyScore,
  ReferenceLink,
  ProgramDeadline,
} from '../types';

export function makeProfile(overrides: Partial<AmbassadorProfile> = {}): AmbassadorProfile {
  return {
    name: 'Maria Eduarda',
    role: 'Embaixadora Estudantil',
    university: 'Universidade Federal',
    course: 'Ciência da Computação',
    bio: 'Apaixonada por IA e comunidade.',
    avatarUrl: '',
    goal2026: 'Impactar 100 estudantes',
    ...overrides,
  };
}

export function makeCertificate(overrides: Partial<Certificate> = {}): Certificate {
  return {
    id: 'cert-1',
    title: 'Google Cloud Fundamentals',
    issuer: 'Google Cloud Skills Boost',
    issueDate: '2026-01-10',
    category: 'Google Cloud',
    description: 'Curso introdutório de Google Cloud.',
    skills: ['GCP', 'Cloud'],
    hours: 4,
    minutes: 0,
    createdAt: '2026-01-10T00:00:00.000Z',
    ...overrides,
  };
}

export function makePrompt(overrides: Partial<PromptItem> = {}): PromptItem {
  return {
    id: 'prompt-1',
    title: 'Plano de estudos',
    promptText: 'Crie um plano de estudos de 7 dias sobre {{tema}}.',
    section: 'Estudos',
    tags: ['estudos'],
    recommendedModel: 'gemini-3.7-flash',
    usageCount: 0,
    createdAt: '2026-01-05T00:00:00.000Z',
    ...overrides,
  };
}

export function makePost(overrides: Partial<GeminiPost> = {}): GeminiPost {
  return {
    id: 'post-1',
    title: 'Conquista desbloqueada',
    platform: 'LinkedIn',
    status: 'Publicado',
    category: 'Certificação',
    tone: 'Inspirador',
    content: 'Acabei de concluir mais uma certificação!',
    hashtags: ['#google', '#embaixadores'],
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

export function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'challenge-1',
    title: 'Desafio de comunidade',
    description: 'Organize um encontro presencial.',
    category: 'Comunidade',
    status: 'Concluído',
    points: 50,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-20T00:00:00.000Z',
    ...overrides,
  };
}

export function makeSession(overrides: Partial<AmbassadorSession> = {}): AmbassadorSession {
  return {
    id: 'session-1',
    title: 'Mentoria com o time Google',
    date: '2026-01-08',
    toolLearned: 'Gemini',
    score: 20,
    createdAt: '2026-01-08T00:00:00.000Z',
    updatedAt: '2026-01-08T00:00:00.000Z',
    ...overrides,
  };
}

export function makeWeeklyScore(overrides: Partial<WeeklyScore> = {}): WeeklyScore {
  return {
    id: 'weekly-score-1',
    weekStart: '2026-08-24',
    weekEnd: '2026-08-31',
    points: 145,
    createdAt: '2026-08-31T00:00:00.000Z',
    updatedAt: '2026-08-31T00:00:00.000Z',
    ...overrides,
  };
}

export function makeReferenceLink(overrides: Partial<ReferenceLink> = {}): ReferenceLink {
  return {
    id: 'reference-link-1',
    title: 'Portfólio da Ana',
    url: 'https://example.com/portfolio-ana',
    sharedBy: 'Ana Souza',
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
    ...overrides,
  };
}

export function makeProgramDeadline(overrides: Partial<ProgramDeadline> = {}): ProgramDeadline {
  return {
    id: 'deadline-1',
    title: 'Entrega do desafio de comunidade',
    date: '2026-09-30',
    category: 'Desafio',
    isCompleted: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}
