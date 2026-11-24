import type { PostPlatform, PostStatus, SocialPost } from '../../types';
import { formatMonthYearBR, toISODate } from '../../utils/date';
import { CHALLENGE_RESULT_TONE, getPostLinks, MANUAL_TONE } from './postModel';

export const PLATFORM_STYLES: Record<PostPlatform, string> = {
  LinkedIn: 'bg-linkedin/10 text-linkedin',
  Instagram: 'bg-instagram/10 text-instagram',
  Whatsapp: 'bg-whatsapp/15 text-whatsapp-dark',
};

export const STATUSES: PostStatus[] = ['Publicado', 'Agendado', 'Rascunho'];

export const STATUS_STYLES: Record<PostStatus, string> = {
  Publicado: 'bg-success/15 text-success-700',
  Agendado: 'bg-primary-50 text-primary-700',
  Rascunho: 'bg-warning-50 text-warning-700',
};

export type PostSortOption = 'recentes' | 'antigos' | 'pontuacao';

export const POST_SORT_LABELS: Record<PostSortOption, string> = {
  recentes: 'Mais recentes',
  antigos: 'Mais antigos',
  pontuacao: 'Maior pontuação',
};

export function isPostSortOption(value: string | null): value is PostSortOption {
  return value !== null && value in POST_SORT_LABELS;
}

export function getPostDate(post: SocialPost): Date {
  if (post.tone === CHALLENGE_RESULT_TONE) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(post.content.split('\n')[0] ?? '');
    if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12);
  }
  return new Date(post.createdAt);
}

const byDateDesc = (a: SocialPost, b: SocialPost) => getPostDate(b).getTime() - getPostDate(a).getTime();

export const POST_SORTERS: Record<PostSortOption, (a: SocialPost, b: SocialPost) => number> = {
  recentes: byDateDesc,
  antigos: (a, b) => -byDateDesc(a, b),
  pontuacao: (a, b) => (b.score ?? 0) - (a.score ?? 0) || byDateDesc(a, b),
};

export interface PostMonthGroup {
  key: string;
  label: string;
  posts: SocialPost[];
}

export function groupPostsByMonth(posts: SocialPost[]): PostMonthGroup[] {
  const groups: PostMonthGroup[] = [];
  for (const post of posts) {
    const date = getPostDate(post);
    const valid = !Number.isNaN(date.getTime());
    const key = valid ? toISODate(date).slice(0, 7) : 'sem-data';
    const last = groups.at(-1);
    if (last?.key === key) {
      last.posts.push(post);
      continue;
    }
    groups.push({ key, label: valid ? formatMonthYearBR(date) : 'Sem data', posts: [post] });
  }
  return groups;
}

export function isLinkOnlyPost(post: SocialPost): boolean {
  return post.tone === CHALLENGE_RESULT_TONE || post.tone === MANUAL_TONE;
}

export function getPostCopyLabel(post: SocialPost): string {
  if (post.tone !== MANUAL_TONE) return 'Copiar';
  return getPostLinks(post).length > 1 ? 'Copiar links' : 'Copiar link';
}

export function formatLinkLabel(link: string, maxLength = 42): string {
  try {
    const url = new URL(link);
    const label = `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}`;
    return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
  } catch {
    return link;
  }
}

export function parseHashtags(input: string, existing: string[] = []): string[] {
  const seen = new Set(existing.map((h) => h.replace(/^#/, '').toLowerCase()));
  const result = [...existing];
  for (const raw of input.split(/[\s,]+/)) {
    const tag = raw.replace(/^#+/, '').trim();
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    result.push(`#${tag}`);
  }
  return result;
}
