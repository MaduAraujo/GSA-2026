import { describe, expect, it } from 'vitest';
import { makeSession } from '../../test/factories';
import { PAST_SESSIONS } from '../pastSessions';
import {
  canonicalTool,
  collectTools,
  draftFromDuplicate,
  draftFromPastSession,
  formatMinutes,
  groupSessionsByMonth,
  matchesSessionQuery,
  parseTools,
  pastSessionType,
  SESSION_SORTERS,
  summarizeSessions,
} from './sessionView';

describe('sessionView', () => {
  it('parses comma-separated tools, trimming and dropping case/accent duplicates', () => {
    expect(parseTools(' Gemini, notebookLM ;gemini,, Canva\nCanvá ')).toEqual(['Gemini', 'notebookLM', 'Canva']);
    expect(parseTools(undefined)).toEqual([]);
  });

  it('collects tools by usage with the most common spelling', () => {
    const tools = collectTools([
      makeSession({ toolLearned: 'Gemini, Canva' }),
      makeSession({ toolLearned: 'Gemini' }),
      makeSession({ toolLearned: 'gemini' }),
    ]);
    expect(tools).toEqual([
      { name: 'Gemini', count: 3 },
      { name: 'Canva', count: 1 },
    ]);
    expect(canonicalTool(' gemini ', ['Gemini'])).toBe('Gemini');
    expect(canonicalTool('Novo', ['Gemini'])).toBe('Novo');
  });

  it('searches title, challenge, tools and notes ignoring accents', () => {
    const session = makeSession({ title: 'Encontro', notes: 'Aprendi sobre automação' });
    expect(matchesSessionQuery(session, 'automacao')).toBe(true);
    expect(matchesSessionQuery(session, 'gemini')).toBe(true);
    expect(matchesSessionQuery(session, 'figma')).toBe(false);
  });

  it('groups consecutive records by month and sorts by score', () => {
    const a = makeSession({ id: 'a', date: '2026-11-10', score: 1 });
    const b = makeSession({ id: 'b', date: '2026-11-02', score: 9 });
    const c = makeSession({ id: 'c', date: '2026-10-20', score: 5 });
    const groups = groupSessionsByMonth([a, b, c].sort(SESSION_SORTERS.recentes));
    expect(groups.map((g) => [g.label, g.sessions.map((s) => s.id)])).toEqual([
      ['Novembro de 2026', ['a', 'b']],
      ['Outubro de 2026', ['c']],
    ]);
    expect([a, b, c].sort(SESSION_SORTERS.pontuacao).map((s) => s.id)).toEqual(['b', 'c', 'a']);
    expect([a, b, c].sort(SESSION_SORTERS.antigas).map((s) => s.id)).toEqual(['c', 'b', 'a']);
  });

  it('summarizes points, minutes, tools and records without proof', () => {
    const summary = summarizeSessions([
      makeSession({ score: 10, durationMinutes: 45, toolLearned: 'Gemini', proofImage: 'x', date: '2026-11-01' }),
      makeSession({ score: undefined, durationMinutes: 30, toolLearned: 'Canva', date: '2026-11-20' }),
    ]);
    expect(summary).toMatchObject({
      count: 2,
      points: 10,
      minutes: 75,
      tools: 2,
      withoutProof: 1,
      latest: '2026-11-20',
    });
    expect(formatMinutes(75)).toBe('1h 15min');
    expect(formatMinutes(120)).toBe('2h');
    expect(formatMinutes(30)).toBe('30min');
  });

  it('maps Acervo meetings to a prefilled record', () => {
    const masterclass = PAST_SESSIONS.find((p) => p.id === 'masterclass-creator-01')!;
    expect(draftFromPastSession(masterclass)).toEqual({
      type: 'Masterclass',
      title: 'Masterclass com Creator #1: Google Gemini para criação de conteúdo',
      date: '2026-09-16',
      pastSessionId: 'masterclass-creator-01',
    });
    expect(pastSessionType(PAST_SESSIONS.find((p) => p.id === 'conversa-googler-01')!)).toBe('Conversa');
    expect(pastSessionType(PAST_SESSIONS.find((p) => p.id === 'gemini-04-gemini-live')!)).toBe('Sessão');
  });

  it('duplicates the subject of a record but not its date, proof or link to the Acervo', () => {
    const draft = draftFromDuplicate(
      makeSession({ id: 'x', proofImage: 'p', pastSessionId: 'gemini-01-study-notebooks', durationMinutes: 60 }),
      '2026-11-24',
    );
    expect(draft).toMatchObject({ title: 'Mentoria com o time Google', date: '2026-11-24', durationMinutes: 60 });
    expect(draft).not.toHaveProperty('id');
    expect(draft).not.toHaveProperty('proofImage');
    expect(draft).not.toHaveProperty('pastSessionId');
  });
});
