import type { Json, Tables, TablesInsert } from '../../types/database';
import type {
  AmbassadorProfile,
  AmbassadorSession,
  Certificate,
  Challenge,
  ChallengeSocialLink,
  ChallengeStatus,
  DeadlineCategory,
  EventDuration,
  GalleryPhoto,
  HostedEvent,
  PostPlatform,
  PostStatus,
  ProgramDeadline,
  PromptDoc,
  PromptItem,
  ReferenceLink,
  SessionFile,
  SessionSummary,
  SocialPost,
  UserBadge,
  WeeklyScore,
} from '../../types';

type SignedUrls = Map<string, string>;

export interface StoredSessionFile {
  id: string;
  name: string;
  fileType: string;
  fileSize?: number;
  path?: string;
  dataUrl?: string;
}

const asJson = (value: unknown) => value as Json;
const mediaType = (value: string | null | undefined): 'image' | 'video' => (value === 'video' ? 'video' : 'image');

export function storedSessionFiles(value: Json | null | undefined): StoredSessionFile[] {
  return Array.isArray(value) ? (value as unknown as StoredSessionFile[]) : [];
}

export const EMPTY_PROFILE: AmbassadorProfile = {
  name: '',
  role: '',
  university: '',
  course: '',
  bio: '',
  avatarUrl: '',
  goal2026: '',
};

export function rowToCertificate(row: Tables<'certificates'>, signedUrls: SignedUrls): Certificate {
  const fileData = row.file_path ? signedUrls.get(row.file_path) : (row.file_data ?? undefined);
  return {
    id: row.id,
    title: row.title,
    issuer: row.issuer,
    issueDate: row.issue_date,
    category: row.category,
    description: row.description,
    fileData,
    fileName: row.file_name ?? undefined,
    fileType: (row.file_type ?? undefined) as Certificate['fileType'],
    skills: row.skills ?? [],
    credentialUrl: row.credential_url ?? undefined,
    credentialId: row.credential_id ?? undefined,
    hours: row.hours ?? undefined,
    minutes: row.minutes ?? undefined,
    isFavorite: row.is_favorite ?? undefined,
    createdAt: row.created_at,
  };
}

export function certificateToRow(
  cert: Certificate,
  userId: string,
  filePath: string | null,
): TablesInsert<'certificates'> {
  return {
    id: cert.id,
    user_id: userId,
    title: cert.title,
    issuer: cert.issuer,
    issue_date: cert.issueDate,
    category: cert.category,
    description: cert.description,
    file_data: filePath ? null : (cert.fileData ?? null),
    file_name: cert.fileName ?? null,
    file_type: cert.fileType ?? null,
    file_path: filePath,
    skills: cert.skills ?? [],
    credential_url: cert.credentialUrl ?? null,
    credential_id: cert.credentialId ?? null,
    hours: cert.hours ?? null,
    minutes: cert.minutes ?? null,
    is_favorite: cert.isFavorite ?? false,
    created_at: cert.createdAt,
  };
}

export function rowToPrompt(row: Tables<'prompts'>): PromptItem {
  return {
    id: row.id,
    title: row.title,
    promptText: row.prompt_text,
    section: row.section,
    description: row.description ?? undefined,
    tags: row.tags ?? [],
    variables: row.variables ?? undefined,
    sharedDocs: row.shared_docs ?? undefined,
    recommendedModel: row.recommended_model as PromptItem['recommendedModel'],
    isFavorite: row.is_favorite ?? undefined,
    usageCount: row.usage_count ?? 0,
    lastUsed: row.last_used ?? undefined,
    createdAt: row.created_at,
  };
}

export function promptToRow(prompt: PromptItem, userId: string): TablesInsert<'prompts'> {
  return {
    id: prompt.id,
    user_id: userId,
    title: prompt.title,
    prompt_text: prompt.promptText,
    section: prompt.section,
    description: prompt.description ?? null,
    tags: prompt.tags ?? [],
    variables: prompt.variables ?? null,
    shared_docs: prompt.sharedDocs ?? null,
    recommended_model: prompt.recommendedModel,
    is_favorite: prompt.isFavorite ?? false,
    usage_count: prompt.usageCount ?? 0,
    last_used: prompt.lastUsed ?? null,
    created_at: prompt.createdAt,
  };
}

export function rowToPromptDoc(row: Tables<'prompt_docs'>, signedUrls: SignedUrls): PromptDoc {
  let fileData: string | undefined;
  let downloadUrl: string | undefined;
  if (row.file_path) {
    fileData = signedUrls.get(row.file_path);
    downloadUrl = fileData ? `${fileData}&download=${encodeURIComponent(row.name)}` : undefined;
  } else if (row.file_data) {
    fileData = row.file_data;
    downloadUrl = row.file_data;
  }

  return {
    id: row.id,
    name: row.name,
    filePath: row.file_path ?? '',
    fileData,
    downloadUrl,
    fileType: row.file_type,
    fileSize: row.file_size ?? undefined,
    createdAt: row.created_at,
  };
}

export function promptDocToRow(doc: PromptDoc, userId: string): TablesInsert<'prompt_docs'> {
  return {
    id: doc.id,
    user_id: userId,
    name: doc.name,
    file_path: doc.filePath || null,
    file_type: doc.fileType,
    file_size: doc.fileSize ?? null,
    created_at: doc.createdAt,
  };
}

export function rowToPost(row: Tables<'posts'>): SocialPost {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform as PostPlatform,
    status: row.status as PostStatus,
    category: row.category,
    tone: row.tone,
    content: row.content,
    promptUsed: row.prompt_used ?? undefined,
    hashtags: row.hashtags ?? [],
    visualIdea: row.visual_idea ?? undefined,
    scheduledDate: row.scheduled_date ?? undefined,
    publishedUrl: row.published_url ?? undefined,
    likes: row.likes ?? undefined,
    comments: row.comments ?? undefined,
    score: row.score ?? undefined,
    socialLinks: (row.social_links ?? undefined) as ChallengeSocialLink[] | undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function postToRow(post: SocialPost, userId: string): TablesInsert<'posts'> {
  return {
    id: post.id,
    user_id: userId,
    title: post.title,
    platform: post.platform,
    status: post.status,
    category: post.category,
    tone: post.tone,
    content: post.content,
    prompt_used: post.promptUsed ?? null,
    hashtags: post.hashtags ?? [],
    visual_idea: post.visualIdea ?? null,
    scheduled_date: post.scheduledDate ?? null,
    published_url: post.publishedUrl ?? null,
    likes: post.likes ?? null,
    comments: post.comments ?? null,
    score: post.score ?? null,
    social_links: post.socialLinks ? asJson(post.socialLinks) : null,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  };
}

export function rowToProfile(row: Tables<'profiles'>): AmbassadorProfile {
  return {
    name: row.name ?? '',
    role: row.role ?? '',
    cohort: row.cohort ?? '',
    university: row.university ?? '',
    course: row.course ?? '',
    bio: row.bio ?? '',
    avatarUrl: row.avatar_url ?? '',
    email: row.email ?? '',
    linkedInUrl: row.linkedin_url ?? '',
    githubUrl: row.github_url ?? '',
    instagramUrl: row.instagram_url ?? '',
    goal2026: row.goal_2026 ?? '',
    isPublic: row.is_public ?? false,
    publicSlug: row.public_slug ?? undefined,
    ambassadorSealUrl: row.ambassador_seal_url ?? undefined,
  };
}

export function profileToRow(profile: AmbassadorProfile, userId: string): TablesInsert<'profiles'> {
  return {
    id: userId,
    name: profile.name ?? '',
    role: profile.role ?? '',
    cohort: profile.cohort ?? '',
    university: profile.university ?? '',
    course: profile.course ?? '',
    bio: profile.bio ?? '',
    avatar_url: profile.avatarUrl ?? '',
    email: profile.email ?? '',
    linkedin_url: profile.linkedInUrl ?? '',
    github_url: profile.githubUrl ?? '',
    instagram_url: profile.instagramUrl ?? '',
    goal_2026: profile.goal2026 ?? '',
    is_public: profile.isPublic ?? false,
    public_slug: profile.publicSlug || null,
    ambassador_seal_url: profile.ambassadorSealUrl || '',
    updated_at: new Date().toISOString(),
  };
}

export function rowToUserBadge(row: Tables<'user_badges'>): UserBadge {
  return {
    badgeId: row.badge_id,
    unlockedAt: row.unlocked_at,
  };
}

export function rowToChallenge(row: Tables<'challenges'>, signedUrls: SignedUrls): Challenge {
  const dates = row.dates && row.dates.length > 0 ? row.dates : row.deadline ? [row.deadline] : undefined;

  const storedLinks = Array.isArray(row.social_links) ? (row.social_links as unknown as ChallengeSocialLink[]) : [];
  const socialLinks =
    storedLinks.length > 0
      ? storedLinks
      : row.result_link
        ? [{ id: row.id, platform: (row.result_platform ?? 'LinkedIn') as PostPlatform, link: row.result_link }]
        : undefined;

  const linkedPostIds =
    row.linked_post_ids && row.linked_post_ids.length > 0
      ? row.linked_post_ids
      : row.linked_post_id
        ? [row.linked_post_id]
        : undefined;

  const resultImage = row.result_image_path ? signedUrls.get(row.result_image_path) : (row.result_image ?? undefined);

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category ?? '',
    status: row.status as ChallengeStatus,
    deadline: dates?.[0] ?? row.deadline ?? undefined,
    dates,
    link: row.link ?? undefined,
    points: row.points ?? undefined,
    result: row.result ?? undefined,
    resultImage,
    resultMediaType: mediaType(row.result_media_type),
    resultLink: row.result_link ?? undefined,
    resultPlatform: (row.result_platform ?? undefined) as PostPlatform | undefined,
    socialLinks,
    externalLink: row.external_link ?? undefined,
    linkedPostId: row.linked_post_id ?? undefined,
    linkedPostIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function challengeToRow(
  challenge: Challenge,
  userId: string,
  resultImagePath: string | null,
): TablesInsert<'challenges'> {
  const dates = challenge.dates && challenge.dates.length > 0 ? challenge.dates : undefined;
  const firstLink = challenge.socialLinks?.[0];

  return {
    id: challenge.id,
    user_id: userId,
    title: challenge.title,
    description: challenge.description ?? '',
    category: challenge.category ?? '',
    status: challenge.status,
    deadline: dates?.[0] || challenge.deadline || null,
    dates: dates || null,
    link: challenge.link || null,
    points: challenge.points ?? null,
    result: challenge.result || null,
    result_image: resultImagePath ? null : challenge.resultImage || null,
    result_image_path: resultImagePath,
    result_media_type: challenge.resultMediaType || 'image',
    result_link: firstLink?.link || challenge.resultLink || null,
    result_platform: firstLink?.platform || challenge.resultPlatform || null,
    social_links: challenge.socialLinks && challenge.socialLinks.length > 0 ? asJson(challenge.socialLinks) : null,
    external_link: challenge.externalLink || null,
    linked_post_id: challenge.linkedPostIds?.[0] || challenge.linkedPostId || null,
    linked_post_ids: challenge.linkedPostIds && challenge.linkedPostIds.length > 0 ? challenge.linkedPostIds : null,
    created_at: challenge.createdAt,
    updated_at: challenge.updatedAt,
  };
}

export function rowToGalleryPhoto(row: Tables<'gallery_photos'>, signedUrls: SignedUrls): GalleryPhoto {
  const imageData = row.image_path ? signedUrls.get(row.image_path) : (row.image_data ?? undefined);
  return {
    id: row.id,
    imageData: imageData || '',
    mediaType: mediaType(row.media_type),
    caption: row.caption ?? '',
    category: row.category ?? '',
    takenAt: row.taken_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function galleryPhotoToRow(
  photo: GalleryPhoto,
  userId: string,
  imagePath: string | null,
): TablesInsert<'gallery_photos'> {
  return {
    id: photo.id,
    user_id: userId,
    image_data: imagePath ? null : (photo.imageData ?? null),
    image_path: imagePath,
    media_type: photo.mediaType || 'image',
    caption: photo.caption ?? '',
    category: photo.category ?? '',
    taken_at: photo.takenAt || null,
    created_at: photo.createdAt,
  };
}

export function rowToSession(row: Tables<'sessions'>, signedUrls: SignedUrls): AmbassadorSession {
  const proofImage = row.proof_image_path ? signedUrls.get(row.proof_image_path) : (row.proof_image ?? undefined);

  const stored = storedSessionFiles(row.challenge_files);
  const challengeFiles: SessionFile[] | undefined =
    stored.length > 0
      ? stored.map((f) => ({
          id: f.id,
          name: f.name,
          fileType: f.fileType,
          fileSize: f.fileSize,
          dataUrl: f.path ? signedUrls.get(f.path) || '' : (f.dataUrl ?? ''),
        }))
      : undefined;

  return {
    id: row.id,
    title: row.title,
    date: row.session_date,
    challenge: row.challenge ?? undefined,
    challengeFiles,
    toolLearned: row.tool_learned ?? '',
    proofImage,
    proofMediaType: mediaType(row.proof_media_type),
    score: row.score ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function sessionToRow(
  session: AmbassadorSession,
  userId: string,
  proofImagePath: string | null,
  challengeFilesForRow: StoredSessionFile[] | null,
): TablesInsert<'sessions'> {
  return {
    id: session.id,
    user_id: userId,
    title: session.title,
    session_date: session.date,
    challenge: session.challenge || null,
    challenge_files: challengeFilesForRow ? asJson(challengeFilesForRow) : null,
    tool_learned: session.toolLearned ?? '',
    proof_image: proofImagePath ? null : session.proofImage || null,
    proof_image_path: proofImagePath,
    proof_media_type: session.proofMediaType || 'image',
    score: session.score ?? null,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
  };
}

export function rowToWeeklyScore(row: Tables<'weekly_scores'>): WeeklyScore {
  return {
    id: row.id,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    points: row.points ?? 0,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function weeklyScoreToRow(weeklyScore: WeeklyScore, userId: string): TablesInsert<'weekly_scores'> {
  return {
    id: weeklyScore.id,
    user_id: userId,
    week_start: weeklyScore.weekStart,
    week_end: weeklyScore.weekEnd,
    points: weeklyScore.points,
    notes: weeklyScore.notes || null,
    created_at: weeklyScore.createdAt,
    updated_at: weeklyScore.updatedAt,
  };
}

export function rowToReferenceLink(row: Tables<'reference_links'>): ReferenceLink {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    sharedBy: row.shared_by ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function referenceLinkToRow(referenceLink: ReferenceLink, userId: string): TablesInsert<'reference_links'> {
  return {
    id: referenceLink.id,
    user_id: userId,
    title: referenceLink.title,
    url: referenceLink.url,
    shared_by: referenceLink.sharedBy || null,
    notes: referenceLink.notes || null,
    created_at: referenceLink.createdAt,
    updated_at: referenceLink.updatedAt,
  };
}

export function rowToProgramDeadline(row: Tables<'program_deadlines'>): ProgramDeadline {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    category: (row.category ?? 'Outro') as DeadlineCategory,
    notes: row.notes ?? undefined,
    points: row.points ?? undefined,
    week: row.week ?? undefined,
    isCompleted: row.is_completed ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function programDeadlineToRow(deadline: ProgramDeadline, userId: string): TablesInsert<'program_deadlines'> {
  return {
    id: deadline.id,
    user_id: userId,
    title: deadline.title,
    date: deadline.date,
    category: deadline.category,
    notes: deadline.notes || null,
    points: deadline.points ?? null,
    week: deadline.week ?? null,
    is_completed: deadline.isCompleted ?? false,
    created_at: deadline.createdAt,
    updated_at: deadline.updatedAt,
  };
}

export function rowToHostedEvent(row: Tables<'hosted_events'>): HostedEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    durationMinutes: ([30, 45, 60].includes(row.duration_minutes) ? row.duration_minutes : 60) as EventDuration,
    format: row.format ?? undefined,
    location: row.location ?? undefined,
    notes: row.notes ?? undefined,
    participants: row.participants ?? undefined,
    checklistDone: row.checklist_done ?? [],
    validationDone: row.validation_done ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function hostedEventToRow(event: HostedEvent, userId: string): TablesInsert<'hosted_events'> {
  return {
    id: event.id,
    user_id: userId,
    title: event.title,
    date: event.date,
    duration_minutes: event.durationMinutes,
    format: event.format || null,
    location: event.location || null,
    notes: event.notes || null,
    participants: event.participants ?? null,
    checklist_done: event.checklistDone,
    validation_done: event.validationDone,
    created_at: event.createdAt,
    updated_at: event.updatedAt,
  };
}

export function rowToSessionSummary(row: Tables<'session_summaries'>, signedUrls: SignedUrls): SessionSummary {
  return {
    sessionId: row.session_id,
    fileName: row.file_name,
    filePath: row.file_path,
    url: signedUrls.get(row.file_path),
    createdAt: row.created_at,
  };
}
