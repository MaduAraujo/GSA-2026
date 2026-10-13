import { describe, expect, it } from 'vitest';
import { makeChallenge, makePost } from '../../test/factories';
import { compareChallenges, nextStatus, planChallengeSave } from './challengeModel';

const NOW = '2026-10-01T12:00:00.000Z';

describe('nextStatus', () => {
  it('cycles Pendente → Em Andamento → Concluído → Pendente', () => {
    expect(nextStatus('Pendente')).toBe('Em Andamento');
    expect(nextStatus('Em Andamento')).toBe('Concluído');
    expect(nextStatus('Concluído')).toBe('Pendente');
  });
});

describe('compareChallenges', () => {
  it('puts the soonest date first and undated challenges last', () => {
    const late = makeChallenge({ id: 'late', dates: ['2026-12-01'] });
    const soon = makeChallenge({ id: 'soon', dates: ['2026-10-05'] });
    const undated = makeChallenge({ id: 'undated', dates: undefined, deadline: undefined });
    expect([undated, late, soon].sort(compareChallenges).map((c) => c.id)).toEqual(['soon', 'late', 'undated']);
  });
});

describe('planChallengeSave', () => {
  it('creates one published post mirroring the social links', () => {
    const plan = planChallengeSave(
      {
        title: ' Desafio X ',
        description: 'desc',
        dates: ['2026-10-10'],
        socialLinks: [{ id: 'l1', platform: 'Instagram', link: 'https://instagram.com/p/1' }],
      },
      [],
      false,
      NOW,
    );

    expect(plan.post).toMatchObject({
      title: 'Desafio X',
      platform: 'Instagram',
      status: 'Publicado',
      publishedUrl: 'https://instagram.com/p/1',
      content: '10/10/2026\nhttps://instagram.com/p/1',
    });
    expect(plan.challenge.linkedPostIds).toEqual([plan.post!.id]);
    expect(plan.staleLinkedPostIds).toEqual([]);
  });

  it('reuses the previously linked post and keeps its engagement numbers', () => {
    const existing = makePost({ id: 'post-1', likes: 42, tone: 'Inspirador' });
    const plan = planChallengeSave(
      {
        title: 'Desafio',
        description: 'desc',
        linkedPostIds: ['post-1'],
        socialLinks: [{ id: 'l1', platform: 'LinkedIn', link: 'https://linkedin.com/a' }],
      },
      [existing],
      false,
      NOW,
    );
    expect(plan.post).toMatchObject({ id: 'post-1', likes: 42, tone: 'Inspirador' });
    expect(plan.staleLinkedPostIds).toEqual([]);
  });

  it('marks the old post as stale once every social link is removed', () => {
    const plan = planChallengeSave(
      { title: 'Desafio', description: 'desc', linkedPostIds: ['post-1'], socialLinks: [] },
      [makePost({ id: 'post-1' })],
      false,
      NOW,
    );
    expect(plan.post).toBeNull();
    expect(plan.staleLinkedPostIds).toEqual(['post-1']);
    expect(plan.challenge.linkedPostIds).toBeUndefined();
  });

  it('records the media type as video when a new video was picked', () => {
    const plan = planChallengeSave({ title: 'D', description: 'd', resultMediaType: 'image' }, [], true, NOW);
    expect(plan.challenge.resultMediaType).toBe('video');
  });
});
