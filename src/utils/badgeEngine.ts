import { Certificate, PromptItem, GeminiPost, UserBadge } from '../types';
import { BADGE_CATALOG, BadgeDefinition, computeBadgeStats } from '../data/badgeCatalog';

export function evaluateNewlyEarnedBadges(
  certificates: Certificate[],
  prompts: PromptItem[],
  posts: GeminiPost[],
  userBadges: UserBadge[]
): BadgeDefinition[] {
  const stats = computeBadgeStats(certificates, prompts, posts);
  const unlockedIds = new Set(userBadges.map((b) => b.badgeId));
  const earned: BadgeDefinition[] = [];

  for (let pass = 0; pass < 2; pass++) {
    for (const badge of BADGE_CATALOG) {
      if (unlockedIds.has(badge.id)) continue;
      if (badge.isMet(stats, unlockedIds)) {
        unlockedIds.add(badge.id);
        earned.push(badge);
      }
    }
  }

  return earned;
}