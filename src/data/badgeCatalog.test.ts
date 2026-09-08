import { describe, expect, it } from 'vitest';
import { BADGE_CATALOG, badgeTierStyle, computeBadgeStats } from './badgeCatalog';
import { makeCertificate, makePost, makePrompt } from '../test/factories';

describe('badgeTierStyle', () => {
  it('returns a distinct style for each tier', () => {
    const tiers = ['bronze', 'silver', 'gold', 'special'] as const;
    const styles = tiers.map(badgeTierStyle);
    expect(new Set(styles.map((s) => s.bg)).size).toBe(4);
    styles.forEach((s) => {
      expect(s).toMatchObject({ bg: expect.any(String), text: expect.any(String), ring: expect.any(String) });
    });
  });
});

describe('computeBadgeStats', () => {
  it('returns all zeros for no activity', () => {
    expect(computeBadgeStats([], [], [])).toEqual({
      certificateCount: 0,
      totalHours: 0,
      categoryCount: 0,
      uniqueSkillCount: 0,
      favoriteCertCount: 0,
      promptCount: 0,
      favoritePromptCount: 0,
      postCount: 0,
      publishedPostCount: 0,
    });
  });

  it('deduplicates categories and skills case-insensitively', () => {
    const stats = computeBadgeStats(
      [
        makeCertificate({ category: 'Google Cloud', skills: ['GCP', 'Cloud'] }),
        makeCertificate({ id: 'c2', category: 'google cloud', skills: ['gcp', 'Liderança'] }),
      ],
      [],
      []
    );
    expect(stats.categoryCount).toBe(1);
    expect(stats.uniqueSkillCount).toBe(3);
  });

  it('counts favorites and published posts separately from totals', () => {
    const stats = computeBadgeStats(
      [makeCertificate({ isFavorite: true }), makeCertificate({ id: 'c2', isFavorite: false })],
      [makePrompt({ isFavorite: true })],
      [makePost({ status: 'Publicado' }), makePost({ id: 'post-2', status: 'Rascunho' })]
    );
    expect(stats.certificateCount).toBe(2);
    expect(stats.favoriteCertCount).toBe(1);
    expect(stats.favoritePromptCount).toBe(1);
    expect(stats.postCount).toBe(2);
    expect(stats.publishedPostCount).toBe(1);
  });
});

describe('BADGE_CATALOG', () => {
  it('has unique ids and a working isMet predicate for every badge', () => {
    const ids = BADGE_CATALOG.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);

    const emptyStats = computeBadgeStats([], [], []);
    BADGE_CATALOG.forEach((badge) => {
      expect(() => badge.isMet(emptyStats, new Set())).not.toThrow();
    });
  });
});
