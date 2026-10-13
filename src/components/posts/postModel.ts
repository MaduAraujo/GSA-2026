import type { ChallengeSocialLink, PostPlatform, SocialPost } from '../../types';

export const PLATFORMS: PostPlatform[] = ['LinkedIn', 'Instagram', 'Whatsapp'];

export const CHALLENGE_RESULT_TONE = 'Resultado de Desafio';
export const MANUAL_TONE = 'Manual';

export function toLocalDateInputValue(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function getPostDisplayDate(post: SocialPost): string {
  if (post.tone === CHALLENGE_RESULT_TONE) {
    const [firstLine] = post.content.split('\n');
    if (firstLine && /^\d{2}\/\d{2}\/\d{4}$/.test(firstLine)) return firstLine;
  }
  return new Date(post.createdAt).toLocaleDateString('pt-BR');
}

export function getPostPlatforms(post: SocialPost): PostPlatform[] {
  if (post.socialLinks && post.socialLinks.length > 0) {
    return Array.from(new Set(post.socialLinks.map((l) => l.platform)));
  }
  return [post.platform];
}

export function getPostLinks(post: SocialPost): ChallengeSocialLink[] {
  if (post.socialLinks && post.socialLinks.length > 0) return post.socialLinks;
  if (post.publishedUrl) return [{ id: 'legacy', platform: post.platform, link: post.publishedUrl }];
  return [];
}

export function getPostCopyText(post: SocialPost): string {
  return post.tone === MANUAL_TONE
    ? getPostLinks(post)
        .map((l) => l.link)
        .join('\n')
    : post.content;
}

export function formatHashtag(tag: string): string {
  return tag.startsWith('#') ? tag : `#${tag}`;
}

export function newManualPost(title = ''): Partial<SocialPost> {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    platform: 'LinkedIn',
    category: '',
    tone: MANUAL_TONE,
    content: '',
    hashtags: [],
    socialLinks: [],
    likes: 0,
    comments: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function canSavePost(post: Partial<SocialPost>): boolean {
  if (!post.title?.trim() || !post.status) return false;
  return post.tone === MANUAL_TONE ? (post.socialLinks?.length ?? 0) > 0 : !!post.content?.trim();
}

export function finalizePost(draft: Partial<SocialPost> & Pick<SocialPost, 'title' | 'status'>): SocialPost {
  const isManual = draft.tone === MANUAL_TONE;
  const socialLinks = draft.socialLinks || [];
  return {
    id: draft.id || crypto.randomUUID(),
    title: draft.title,
    platform: isManual ? socialLinks[0]?.platform || 'LinkedIn' : draft.platform || 'LinkedIn',
    status: draft.status,
    category: (draft.category || '').trim(),
    tone: draft.tone || 'Inspirador',
    content: draft.content || '',
    promptUsed: draft.promptUsed,
    hashtags: draft.hashtags || [],
    visualIdea: draft.visualIdea,
    scheduledDate: draft.scheduledDate,
    publishedUrl: isManual ? socialLinks[0]?.link : draft.publishedUrl,
    socialLinks: isManual ? socialLinks : draft.socialLinks,
    likes: draft.likes || 0,
    comments: draft.comments || 0,
    score: draft.score,
    createdAt: draft.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
