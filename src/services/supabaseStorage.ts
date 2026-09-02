import { supabase } from './supabaseClient';
import {
  Certificate,
  PromptItem,
  PromptDoc,
  GeminiPost,
  AmbassadorProfile,
  UserBadge,
  Challenge,
  GalleryPhoto,
  AmbassadorSession,
  SessionFile,
  PushSubscriptionKeys,
} from '../types';

const USER_FILES_BUCKET = 'user-files';
const USER_FILE_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

function isDataUrl(value?: string | null): value is string {
  return !!value && value.startsWith('data:');
}

async function uploadUserFile(dataUrl: string, path: string): Promise<void> {
  const blob = await (await fetch(dataUrl)).blob();
  const { error } = await supabase.storage
    .from(USER_FILES_BUCKET)
    .upload(path, blob, { upsert: true, contentType: blob.type || undefined });
  if (error) throw error;
}

async function getUserFileSignedUrl(path: string): Promise<string | undefined> {
  const { data } = await supabase.storage.from(USER_FILES_BUCKET).createSignedUrl(path, USER_FILE_SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl;
}

async function removeUserFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(USER_FILES_BUCKET).remove(paths);
}

async function rowToCertificate(row: any): Promise<Certificate> {
  const fileData = row.file_path ? await getUserFileSignedUrl(row.file_path) : row.file_data ?? undefined;
  return {
    id: row.id,
    title: row.title,
    issuer: row.issuer,
    issueDate: row.issue_date,
    category: row.category,
    description: row.description,
    fileData,
    fileName: row.file_name ?? undefined,
    fileType: row.file_type ?? undefined,
    skills: row.skills ?? [],
    credentialUrl: row.credential_url ?? undefined,
    credentialId: row.credential_id ?? undefined,
    hours: row.hours ?? undefined,
    minutes: row.minutes ?? undefined,
    isFavorite: row.is_favorite ?? undefined,
    createdAt: row.created_at,
  };
}

function certificateToRow(cert: Certificate, userId: string, filePath: string | null) {
  return {
    id: cert.id,
    user_id: userId,
    title: cert.title,
    issuer: cert.issuer,
    issue_date: cert.issueDate,
    category: cert.category,
    description: cert.description,
    file_data: filePath ? null : cert.fileData ?? null,
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

function rowToPrompt(row: any): PromptItem {
  return {
    id: row.id,
    title: row.title,
    promptText: row.prompt_text,
    section: row.section,
    description: row.description ?? undefined,
    tags: row.tags ?? [],
    variables: row.variables ?? undefined,
    sharedDocs: row.shared_docs ?? undefined,
    recommendedModel: row.recommended_model,
    isFavorite: row.is_favorite ?? undefined,
    usageCount: row.usage_count ?? 0,
    lastUsed: row.last_used ?? undefined,
    createdAt: row.created_at,
  };
}

function promptToRow(prompt: PromptItem, userId: string) {
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

const PROMPT_DOCS_BUCKET = 'prompt-docs';
const PROMPT_DOC_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; 

async function rowToPromptDoc(row: any): Promise<PromptDoc> {
  let fileData: string | undefined;
  let downloadUrl: string | undefined;
  if (row.file_path) {
    const [viewResult, downloadResult] = await Promise.all([
      supabase.storage.from(PROMPT_DOCS_BUCKET).createSignedUrl(row.file_path, PROMPT_DOC_SIGNED_URL_TTL_SECONDS),
      supabase.storage
        .from(PROMPT_DOCS_BUCKET)
        .createSignedUrl(row.file_path, PROMPT_DOC_SIGNED_URL_TTL_SECONDS, { download: row.name }),
    ]);
    fileData = viewResult.data?.signedUrl;
    downloadUrl = downloadResult.data?.signedUrl;
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

function promptDocToRow(doc: PromptDoc, userId: string) {
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

function rowToPost(row: any): GeminiPost {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    status: row.status,
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
    socialLinks: row.social_links ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function postToRow(post: GeminiPost, userId: string) {
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
    social_links: post.socialLinks ?? null,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  };
}

function rowToProfile(row: any): AmbassadorProfile {
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
  };
}

function profileToRow(profile: AmbassadorProfile, userId: string) {
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
    updated_at: new Date().toISOString(),
  };
}

function rowToUserBadge(row: any): UserBadge {
  return {
    badgeId: row.badge_id,
    unlockedAt: row.unlocked_at,
  };
}

function rowToChallenge(row: any): Challenge {
  const dates: string[] | undefined =
    Array.isArray(row.dates) && row.dates.length > 0
      ? row.dates
      : row.deadline
      ? [row.deadline]
      : undefined;

  const socialLinks =
    Array.isArray(row.social_links) && row.social_links.length > 0
      ? row.social_links
      : row.result_link
      ? [{ id: row.id, platform: row.result_platform ?? 'LinkedIn', link: row.result_link }]
      : undefined;

  const linkedPostIds: string[] | undefined =
    Array.isArray(row.linked_post_ids) && row.linked_post_ids.length > 0
      ? row.linked_post_ids
      : row.linked_post_id
      ? [row.linked_post_id]
      : undefined;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category ?? '',
    status: row.status,
    deadline: dates?.[0] ?? row.deadline ?? undefined,
    dates,
    link: row.link ?? undefined,
    points: row.points ?? undefined,
    result: row.result ?? undefined,
    resultImage: row.result_image ?? undefined,
    resultLink: row.result_link ?? undefined,
    resultPlatform: row.result_platform ?? undefined,
    socialLinks,
    linkedPostId: row.linked_post_id ?? undefined,
    linkedPostIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function challengeToRow(challenge: Challenge, userId: string) {
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
    result_image: challenge.resultImage || null,
    result_link: firstLink?.link || challenge.resultLink || null,
    result_platform: firstLink?.platform || challenge.resultPlatform || null,
    social_links: challenge.socialLinks && challenge.socialLinks.length > 0 ? challenge.socialLinks : null,
    linked_post_id: challenge.linkedPostIds?.[0] || challenge.linkedPostId || null,
    linked_post_ids:
      challenge.linkedPostIds && challenge.linkedPostIds.length > 0 ? challenge.linkedPostIds : null,
    created_at: challenge.createdAt,
    updated_at: challenge.updatedAt,
  };
}

async function rowToGalleryPhoto(row: any): Promise<GalleryPhoto> {
  const imageData = row.image_path ? await getUserFileSignedUrl(row.image_path) : row.image_data ?? undefined;
  return {
    id: row.id,
    imageData: imageData || '',
    caption: row.caption ?? '',
    category: row.category ?? '',
    takenAt: row.taken_at ?? undefined,
    createdAt: row.created_at,
  };
}

function galleryPhotoToRow(photo: GalleryPhoto, userId: string, imagePath: string | null) {
  return {
    id: photo.id,
    user_id: userId,
    image_data: imagePath ? null : photo.imageData ?? null,
    image_path: imagePath,
    caption: photo.caption ?? '',
    category: photo.category ?? '',
    taken_at: photo.takenAt || null,
    created_at: photo.createdAt,
  };
}

async function rowToSession(row: any): Promise<AmbassadorSession> {
  const proofImage = row.proof_image_path
    ? await getUserFileSignedUrl(row.proof_image_path)
    : row.proof_image ?? undefined;

  const rawChallengeFiles: any[] = Array.isArray(row.challenge_files) ? row.challenge_files : [];
  const challengeFiles: SessionFile[] | undefined =
    rawChallengeFiles.length > 0
      ? await Promise.all(
          rawChallengeFiles.map(async (f) => ({
            id: f.id,
            name: f.name,
            fileType: f.fileType,
            fileSize: f.fileSize,
            dataUrl: f.path ? (await getUserFileSignedUrl(f.path)) || '' : f.dataUrl ?? '',
          }))
        )
      : undefined;

  return {
    id: row.id,
    title: row.title,
    date: row.session_date,
    challenge: row.challenge ?? undefined,
    challengeFiles,
    toolLearned: row.tool_learned ?? '',
    proofImage,
    score: row.score ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sessionToRow(
  session: AmbassadorSession,
  userId: string,
  proofImagePath: string | null,
  challengeFilesForRow: Array<{ id: string; name: string; fileType: string; fileSize?: number; path: string }> | null
) {
  return {
    id: session.id,
    user_id: userId,
    title: session.title,
    session_date: session.date,
    challenge: session.challenge || null,
    challenge_files: challengeFilesForRow,
    tool_learned: session.toolLearned ?? '',
    proof_image: proofImagePath ? null : session.proofImage || null,
    proof_image_path: proofImagePath,
    score: session.score ?? null,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
  };
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Não autenticado.');
  return data.user.id;
}

export const SupabaseStorageService = {
  async getProfile(): Promise<AmbassadorProfile> {
    const userId = await requireUserId();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    if (!data) return { name: '', role: '', university: '', course: '', bio: '', avatarUrl: '', goal2026: '' };
    return rowToProfile(data);
  },

  async saveProfile(profile: AmbassadorProfile): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('profiles').upsert(profileToRow(profile, userId));
    if (error) throw error;
  },

  async getCertificates(): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map(rowToCertificate));
  },

  async saveCertificate(cert: Certificate): Promise<void> {
    const userId = await requireUserId();
    let filePath: string | null = null;
    if (isDataUrl(cert.fileData)) {
      filePath = `${userId}/certificates/${cert.id}`;
      await uploadUserFile(cert.fileData, filePath);
    } else if (cert.fileData) {
      filePath = `${userId}/certificates/${cert.id}`;
    }
    const { error } = await supabase.from('certificates').upsert(certificateToRow(cert, userId, filePath));
    if (error) throw error;
  },

  async deleteCertificate(id: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('certificates').delete().eq('id', id);
    if (error) throw error;
    await removeUserFiles([`${userId}/certificates/${id}`]);
  },

  async getChallenges(): Promise<Challenge[]> {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToChallenge);
  },

  async saveChallenge(challenge: Challenge): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('challenges').upsert(challengeToRow(challenge, userId));
    if (error) throw error;
  },

  async deleteChallenge(id: string): Promise<void> {
    const { error } = await supabase.from('challenges').delete().eq('id', id);
    if (error) throw error;
  },

  async getGalleryPhotos(): Promise<GalleryPhoto[]> {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map(rowToGalleryPhoto));
  },

  async saveGalleryPhoto(photo: GalleryPhoto): Promise<void> {
    const userId = await requireUserId();
    let imagePath: string | null = null;
    if (isDataUrl(photo.imageData)) {
      imagePath = `${userId}/gallery/${photo.id}`;
      await uploadUserFile(photo.imageData, imagePath);
    }
    const { error } = await supabase.from('gallery_photos').upsert(galleryPhotoToRow(photo, userId, imagePath));
    if (error) throw error;
  },

  async deleteGalleryPhoto(id: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('gallery_photos').delete().eq('id', id);
    if (error) throw error;
    await removeUserFiles([`${userId}/gallery/${id}`]);
  },

  async getSessions(): Promise<AmbassadorSession[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('session_date', { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map(rowToSession));
  },

  async saveSession(session: AmbassadorSession): Promise<void> {
    const userId = await requireUserId();

    let proofImagePath: string | null = null;
    if (isDataUrl(session.proofImage)) {
      proofImagePath = `${userId}/sessions/${session.id}/proof`;
      await uploadUserFile(session.proofImage, proofImagePath);
    } else if (session.proofImage) {
      proofImagePath = `${userId}/sessions/${session.id}/proof`;
    }

    let challengeFilesForRow: Array<{ id: string; name: string; fileType: string; fileSize?: number; path: string }> | null = null;
    if (session.challengeFiles && session.challengeFiles.length > 0) {
      challengeFilesForRow = await Promise.all(
        session.challengeFiles.map(async (file) => {
          const path = `${userId}/sessions/${session.id}/challenge-${file.id}`;
          if (isDataUrl(file.dataUrl)) {
            await uploadUserFile(file.dataUrl, path);
          }
          return { id: file.id, name: file.name, fileType: file.fileType, fileSize: file.fileSize, path };
        })
      );
    }

    const { error } = await supabase
      .from('sessions')
      .upsert(sessionToRow(session, userId, proofImagePath, challengeFilesForRow));
    if (error) throw error;
  },

  async deleteSession(id: string): Promise<void> {
    const userId = await requireUserId();
    const { data: row } = await supabase.from('sessions').select('challenge_files').eq('id', id).maybeSingle();
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) throw error;
    const attachmentPaths: string[] = Array.isArray(row?.challenge_files)
      ? row.challenge_files.map((f: any) => f.path).filter(Boolean)
      : [];
    await removeUserFiles([`${userId}/sessions/${id}/proof`, ...attachmentPaths]);
  },

  async getUserBadges(): Promise<UserBadge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .order('unlocked_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToUserBadge);
  },

  async unlockBadge(badgeId: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from('user_badges')
      .upsert(
        { user_id: userId, badge_id: badgeId, unlocked_at: new Date().toISOString() },
        { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
      );
    if (error) throw error;
  },

  async getPrompts(): Promise<PromptItem[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToPrompt);
  },

  async savePrompt(prompt: PromptItem): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('prompts').upsert(promptToRow(prompt, userId));
    if (error) throw error;
  },

  async deletePrompt(id: string): Promise<void> {
    const { error } = await supabase.from('prompts').delete().eq('id', id);
    if (error) throw error;
  },

  async getPromptDocs(): Promise<PromptDoc[]> {
    const { data, error } = await supabase
      .from('prompt_docs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map(rowToPromptDoc));
  },

  async uploadPromptDocFile(file: File, docId: string): Promise<string> {
    const userId = await requireUserId();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `${userId}/${docId}-${safeName}`;
    const { error } = await supabase.storage.from(PROMPT_DOCS_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  },

  async deletePromptDocFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage.from(PROMPT_DOCS_BUCKET).remove([filePath]);
    if (error) throw error;
  },

  async savePromptDoc(doc: PromptDoc): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('prompt_docs').upsert(promptDocToRow(doc, userId));
    if (error) throw error;
  },

  async deletePromptDoc(id: string): Promise<void> {
    const { error } = await supabase.from('prompt_docs').delete().eq('id', id);
    if (error) throw error;
  },

  async getPosts(): Promise<GeminiPost[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToPost);
  },

  async savePost(post: GeminiPost): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('posts').upsert(postToRow(post, userId));
    if (error) throw error;
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
  },

  async getPublicProfileBySlug(slug: string): Promise<{ userId: string; profile: AmbassadorProfile } | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('public_slug', slug).maybeSingle();
    if (error) throw error;
    return data ? { userId: data.id, profile: rowToProfile(data) } : null;
  },

  async getPublicCertificates(userId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('issue_date', { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map(rowToCertificate));
  },

  async savePushSubscription(keys: PushSubscriptionKeys): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: keys.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      { onConflict: 'endpoint' }
    );
    if (error) throw error;
  },

  async deletePushSubscription(endpoint: string): Promise<void> {
    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    if (error) throw error;
  },

  async listPushSubscriptions(): Promise<PushSubscriptionKeys[]> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth }));
  },

  async exportAllData(): Promise<string> {
    const [profile, certificates, prompts, posts, challenges, galleryPhotos, sessions] = await Promise.all([
      this.getProfile(),
      this.getCertificates(),
      this.getPrompts(),
      this.getPosts(),
      this.getChallenges(),
      this.getGalleryPhotos(),
      this.getSessions(),
    ]);

    const payload = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      profile,
      certificates,
      prompts,
      posts,
      challenges,
      galleryPhotos,
      sessions,
    };

    return JSON.stringify(payload, null, 2);
  },

  async importAllData(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile) {
        await this.saveProfile(parsed.profile);
      }
      if (Array.isArray(parsed.certificates)) {
        for (const c of parsed.certificates) {
          await this.saveCertificate(c);
        }
      }
      if (Array.isArray(parsed.prompts)) {
        for (const p of parsed.prompts) {
          await this.savePrompt(p);
        }
      }
      if (Array.isArray(parsed.challenges)) {
        for (const c of parsed.challenges) {
          await this.saveChallenge(c);
        }
      }
      if (Array.isArray(parsed.posts)) {
        for (const post of parsed.posts) {
          await this.savePost(post);
        }
      }
      if (Array.isArray(parsed.galleryPhotos)) {
        for (const photo of parsed.galleryPhotos) {
          await this.saveGalleryPhoto(photo);
        }
      }
      if (Array.isArray(parsed.sessions)) {
        for (const session of parsed.sessions) {
          await this.saveSession(session);
        }
      }
      return true;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  },
};