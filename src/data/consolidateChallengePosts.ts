import { SupabaseStorageService as Storage } from '../services/supabaseStorage';
import type { Challenge, SocialPost } from '../types';

export async function consolidateDuplicateChallengePosts(
  challenges: Challenge[],
  posts: SocialPost[],
): Promise<boolean> {
  let changed = false;
  let currentPosts = posts;

  for (const challenge of challenges) {
    const linkedIds =
      challenge.linkedPostIds && challenge.linkedPostIds.length > 0
        ? challenge.linkedPostIds
        : challenge.linkedPostId
          ? [challenge.linkedPostId]
          : [];
    if (linkedIds.length <= 1) continue;

    const linkedPosts = linkedIds
      .map((id) => currentPosts.find((p) => p.id === id))
      .filter((p): p is SocialPost => !!p);
    const [survivor, ...stale] = linkedPosts;
    if (!survivor || stale.length === 0) continue;

    const staleIds = stale.map((p) => p.id);

    const socialLinks =
      challenge.socialLinks && challenge.socialLinks.length > 0
        ? challenge.socialLinks
        : linkedPosts
            .filter((p): p is SocialPost & { publishedUrl: string } => !!p.publishedUrl)
            .map((p) => ({ id: crypto.randomUUID(), platform: p.platform, link: p.publishedUrl }));

    const now = new Date().toISOString();
    const mergedPost: SocialPost = {
      ...survivor,
      platform: socialLinks[0]?.platform || survivor.platform,
      publishedUrl: socialLinks[0]?.link || survivor.publishedUrl,
      socialLinks,
      updatedAt: now,
    };

    const mergedChallenge: Challenge = {
      ...challenge,
      linkedPostId: survivor.id,
      linkedPostIds: [survivor.id],
      socialLinks,
      resultLink: socialLinks[0]?.link,
      resultPlatform: socialLinks[0]?.platform,
      updatedAt: now,
    };

    try {
      await Storage.savePost(mergedPost);
      for (const staleId of staleIds) {
        await Storage.deletePost(staleId);
      }
      await Storage.saveChallenge(mergedChallenge);
      currentPosts = currentPosts.filter((p) => !staleIds.includes(p.id));
      changed = true;
    } catch (e) {
      console.error('Falha ao consolidar posts duplicados do desafio', challenge.id, e);
    }
  }

  return changed;
}
