import type { AmbassadorSession, SessionType } from '../../types';
import { formatMonthYearBR } from '../../utils/date';
import { normalizeSearch } from '../../utils/search';
import { PAST_SESSIONS, type PastSession } from '../pastSessions';

export function parseTools(text?: string): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const tools: string[] = [];
  for (const raw of text.split(/[,;\n]/)) {
    const tool = raw.trim();
    const key = normalizeSearch(tool);
    if (!tool || seen.has(key)) continue;
    seen.add(key);
    tools.push(tool);
  }
  return tools;
}

export const joinTools = (tools: string[]) => tools.join(', ');

export function collectTools(sessions: AmbassadorSession[]): { name: string; count: number }[] {
  const byKey = new Map<string, { spellings: Map<string, number>; count: number }>();
  for (const session of sessions) {
    for (const tool of parseTools(session.toolLearned)) {
      const key = normalizeSearch(tool);
      const entry = byKey.get(key) ?? { spellings: new Map(), count: 0 };
      entry.count += 1;
      entry.spellings.set(tool, (entry.spellings.get(tool) ?? 0) + 1);
      byKey.set(key, entry);
    }
  }
  return [...byKey.values()]
    .map(({ spellings, count }) => ({
      name: [...spellings.entries()].sort((a, b) => b[1] - a[1])[0]![0],
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
}

export function canonicalTool(tool: string, known: string[]): string {
  const key = normalizeSearch(tool.trim());
  return known.find((k) => normalizeSearch(k) === key) ?? tool.trim();
}

export const hasTool = (session: AmbassadorSession, tool: string) =>
  parseTools(session.toolLearned).some((t) => normalizeSearch(t) === normalizeSearch(tool));

export function matchesSessionQuery(session: AmbassadorSession, query: string): boolean {
  const q = normalizeSearch(query.trim());
  if (!q) return true;
  return [session.title, session.challenge, session.toolLearned, session.notes].some((field) =>
    normalizeSearch(field ?? '').includes(q),
  );
}

export type SessionFilter = 'todas' | 'sem-comprovacao' | 'com-desafio' | 'com-anotacoes';

export const SESSION_FILTERS: { value: SessionFilter; label: string; test: (s: AmbassadorSession) => boolean }[] = [
  { value: 'todas', label: 'Todas', test: () => true },
  { value: 'sem-comprovacao', label: 'Sem comprovação', test: (s) => !s.proofImage },
  { value: 'com-desafio', label: 'Com desafio', test: (s) => !!s.challenge || !!s.challengeFiles?.length },
  { value: 'com-anotacoes', label: 'Com anotações', test: (s) => !!s.notes?.trim() },
];

export const sessionFilterTest = (filter: string) =>
  (SESSION_FILTERS.find((f) => f.value === filter) ?? SESSION_FILTERS[0]!).test;

export type SessionSort = 'recentes' | 'antigas' | 'pontuacao';

export const SESSION_SORT_LABELS: Record<SessionSort, string> = {
  recentes: 'Mais recentes',
  antigas: 'Mais antigas',
  pontuacao: 'Maior pontuação',
};

export const isSessionSort = (value: string): value is SessionSort => value in SESSION_SORT_LABELS;

const byDateDesc = (a: AmbassadorSession, b: AmbassadorSession) =>
  a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : a.date < b.date ? 1 : -1;

export const SESSION_SORTERS: Record<SessionSort, (a: AmbassadorSession, b: AmbassadorSession) => number> = {
  recentes: byDateDesc,
  antigas: (a, b) => -byDateDesc(a, b),
  pontuacao: (a, b) => (b.score ?? 0) - (a.score ?? 0) || byDateDesc(a, b),
};

export interface SessionMonthGroup {
  key: string;
  label: string;
  sessions: AmbassadorSession[];
}

export function groupSessionsByMonth(sessions: AmbassadorSession[]): SessionMonthGroup[] {
  const groups: SessionMonthGroup[] = [];
  for (const session of sessions) {
    const valid = /^\d{4}-\d{2}/.test(session.date);
    const key = valid ? session.date.slice(0, 7) : 'sem-data';
    const last = groups.at(-1);
    if (last?.key === key) {
      last.sessions.push(session);
      continue;
    }
    groups.push({ key, label: valid ? formatMonthYearBR(`${key}-01`) : 'Sem data', sessions: [session] });
  }
  return groups;
}

export function summarizeSessions(sessions: AmbassadorSession[]) {
  const latest = sessions.reduce<string | undefined>((max, s) => (!max || s.date > max ? s.date : max), undefined);
  return {
    count: sessions.length,
    points: sessions.reduce((sum, s) => sum + (s.score ?? 0), 0),
    minutes: sessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0),
    tools: collectTools(sessions).length,
    withoutProof: sessions.filter((s) => !s.proofImage).length,
    latest,
  };
}

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h}h ${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
}

const PROGRAM_YEAR = 2026;

export function pastSessionDateISO(past: PastSession): string {
  const [day, month] = past.date.split('/');
  return day && month ? `${PROGRAM_YEAR}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : '';
}

export function pastSessionType(past: PastSession): SessionType {
  const label = normalizeSearch(`${past.series ?? ''} ${past.title}`);
  if (label.includes('masterclass')) return 'Masterclass';
  if (label.includes('conversa')) return 'Conversa';
  return 'Sessão';
}

export const pastSessionTitle = (past: PastSession) => (past.series ? `${past.series}: ${past.title}` : past.title);

export const findPastSession = (id?: string) => (id ? PAST_SESSIONS.find((p) => p.id === id) : undefined);

export function draftFromPastSession(past: PastSession): Partial<AmbassadorSession> {
  return {
    type: pastSessionType(past),
    title: pastSessionTitle(past),
    date: pastSessionDateISO(past),
    pastSessionId: past.id,
  };
}

export function draftFromDuplicate(session: AmbassadorSession, today: string): Partial<AmbassadorSession> {
  return {
    type: session.type,
    title: session.title,
    date: today,
    toolLearned: session.toolLearned,
    challenge: session.challenge,
    durationMinutes: session.durationMinutes,
    score: session.score,
  };
}
