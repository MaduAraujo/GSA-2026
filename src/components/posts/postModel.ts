import type { ChallengeSocialLink, PostPlatform, SocialPost } from '../../types';
import { formatDateBR, toISODate } from '../../utils/date';

export const PLATFORMS: PostPlatform[] = ['LinkedIn', 'Instagram', 'Whatsapp'];

export const CHALLENGE_RESULT_TONE = 'Resultado de Desafio';
export const MANUAL_TONE = 'Manual';

export function toLocalDateInputValue(iso: string): string {
  return toISODate(new Date(iso));
}

export function getPostDisplayDate(post: SocialPost): string {
  if (post.tone === CHALLENGE_RESULT_TONE) {
    const [firstLine] = post.content.split('\n');
    if (firstLine && /^\d{2}\/\d{2}\/\d{4}$/.test(firstLine)) return firstLine;
  }
  return formatDateBR(post.createdAt);
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
    status: 'Publicado',
    likes: 0,
    comments: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeHttpUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function getMissingPostFields(post: Partial<SocialPost>): string[] {
  const missing: string[] = [];
  if (!post.title?.trim()) missing.push('título');
  if (!post.status) missing.push('status');
  if (post.tone === MANUAL_TONE) {
    if ((post.socialLinks?.length ?? 0) === 0) missing.push('pelo menos 1 link');
  } else if (!post.content?.trim()) {
    missing.push('conteúdo');
  }
  return missing;
}

export function canSavePost(post: Partial<SocialPost>): boolean {
  return getMissingPostFields(post).length === 0;
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
