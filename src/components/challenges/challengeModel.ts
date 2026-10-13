import { CheckCircle2, Circle, Clock3 } from 'lucide-react';
import type { Challenge, ChallengeStatus, PostPlatform, SocialPost } from '../../types';
import { formatDateBR } from '../../utils/date';

export const STATUSES: ChallengeStatus[] = ['Pendente', 'Em Andamento', 'Concluído'];

export const RESULT_PLATFORMS: PostPlatform[] = ['LinkedIn', 'Instagram', 'Whatsapp'];

export const STATUS_STYLES: Record<ChallengeStatus, { bg: string; text: string; icon: typeof Circle }> = {
  Pendente: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Circle },
  'Em Andamento': { bg: 'bg-[#1A73E8]/10', text: 'text-[#1A73E8]', icon: Clock3 },
  Concluído: { bg: 'bg-[#34A853]/10', text: 'text-[#1E8E3E]', icon: CheckCircle2 },
};

export function nextStatus(status: ChallengeStatus): ChallengeStatus {
  const idx = STATUSES.indexOf(status);
  return STATUSES[(idx + 1) % STATUSES.length] ?? 'Pendente';
}

export function compareChallenges(a: Challenge, b: Challenge): number {
  const aDate = a.dates?.[0] || a.deadline;
  const bDate = b.dates?.[0] || b.deadline;
  if (aDate && bDate) return aDate.localeCompare(bDate);
  if (aDate) return -1;
  if (bDate) return 1;
  return b.createdAt.localeCompare(a.createdAt);
}

export interface ChallengeSavePlan {
  post: SocialPost | null;
  staleLinkedPostIds: string[];
  challenge: Challenge;
}

export function planChallengeSave(
  formData: Partial<Challenge>,
  posts: SocialPost[],
  hasNewVideo: boolean,
  now = new Date().toISOString(),
): ChallengeSavePlan {
  const title = (formData.title || '').trim();
  const dates = (formData.dates || []).slice().sort();
  const socialLinks = formData.socialLinks || [];
  const firstLink = socialLinks[0];
  const previousLinkedPostIds = formData.linkedPostIds || (formData.linkedPostId ? [formData.linkedPostId] : []);
  const existingPost = previousLinkedPostIds[0] ? posts.find((p) => p.id === previousLinkedPostIds[0]) : undefined;

  let post: SocialPost | null = null;
  if (firstLink) {
    post = {
      id: existingPost?.id || crypto.randomUUID(),
      title,
      platform: firstLink.platform,
      status: 'Publicado',
      category: (formData.category || '').trim(),
      tone: existingPost?.tone || 'Resultado de Desafio',
      content: [dates[0] ? formatDateBR(dates[0]) : '', firstLink.link].filter(Boolean).join('\n'),
      promptUsed: existingPost?.promptUsed || `Resultado do desafio: "${title}"`,
      hashtags: existingPost?.hashtags || [],
      visualIdea: existingPost?.visualIdea,
      publishedUrl: firstLink.link,
      socialLinks,
      likes: existingPost?.likes ?? 0,
      comments: existingPost?.comments ?? 0,
      score: existingPost?.score,
      createdAt: existingPost?.createdAt || now,
      updatedAt: now,
    };
  }

  const linkedPostIds = post ? [post.id] : [];

  const challenge: Challenge = {
    id: formData.id || crypto.randomUUID(),
    title,
    description: (formData.description || '').trim(),
    category: (formData.category || '').trim(),
    status: formData.status || 'Pendente',
    deadline: dates[0] || undefined,
    dates: dates.length > 0 ? dates : undefined,
    link: formData.link || undefined,
    points: formData.points ? Number(formData.points) : undefined,
    result: (formData.result || '').trim() || undefined,
    resultImage: formData.resultImage || undefined,
    resultMediaType: hasNewVideo ? 'video' : formData.resultMediaType || 'image',
    resultLink: firstLink?.link,
    resultPlatform: firstLink?.platform,
    socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
    externalLink: (formData.externalLink || '').trim() || undefined,
    linkedPostId: linkedPostIds[0],
    linkedPostIds: linkedPostIds.length > 0 ? linkedPostIds : undefined,
    createdAt: formData.createdAt || now,
    updatedAt: now,
  };

  return {
    post,
    staleLinkedPostIds: previousLinkedPostIds.filter((id) => !linkedPostIds.includes(id)),
    challenge,
  };
}
