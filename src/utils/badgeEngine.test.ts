import { describe, it, expect } from 'vitest';
import { evaluateNewlyEarnedBadges } from './badgeEngine';
import type { Certificate, PromptItem, GeminiPost, UserBadge } from '../types';

function makeCert(overrides: Partial<Certificate> = {}): Certificate {
  return {
    id: crypto.randomUUID(),
    title: 'Cert',
    issuer: 'Google',
    issueDate: '2026-01-01',
    category: 'Google Cloud',
    description: '',
    skills: [],
    hours: 1,
    minutes: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('evaluateNewlyEarnedBadges', () => {
  it('returns no badges when there is no activity yet', () => {
    const earned = evaluateNewlyEarnedBadges([], [], [], []);
    expect(earned).toEqual([]);
  });

  it('awards the first-certificate badge on the first certificate', () => {
    const earned = evaluateNewlyEarnedBadges([makeCert()], [], [], []);
    expect(earned.map((b) => b.id)).toContain('first_certificate');
  });

  it('does not re-award a badge the user already has', () => {
    const userBadges: UserBadge[] = [{ badgeId: 'first_certificate', unlockedAt: new Date().toISOString() }];
    const earned = evaluateNewlyEarnedBadges([makeCert()], [], [], userBadges);
    expect(earned.map((b) => b.id)).not.toContain('first_certificate');
  });

  it('awards every tier crossed in a single evaluation (e.g. 5 certs unlocks both first and five)', () => {
    const certs = Array.from({ length: 5 }, () => makeCert());
    const earned = evaluateNewlyEarnedBadges(certs, [], [], []);
    const ids = earned.map((b) => b.id);
    expect(ids).toContain('first_certificate');
    expect(ids).toContain('five_certificates');
  });

  it('only awards all_star once every other badge is already unlocked', () => {
    const prompts: PromptItem[] = [];
    const posts: GeminiPost[] = [];
    const partialBadges: UserBadge[] = [
      'first_certificate', 'five_certificates', 'ten_certificates', 'fifty_hours', 'hundred_hours',
      'five_categories', 'ten_skills', 'first_favorite', 'first_prompt', 'ten_prompts', 'first_post',
      'five_published_posts',
    ].map((badgeId) => ({ badgeId, unlockedAt: new Date().toISOString() }));

    const earned = evaluateNewlyEarnedBadges([], prompts, posts, partialBadges);
    expect(earned.map((b) => b.id)).toContain('all_star');
  });
});
