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
  ChatSession,
  ChatMessageRecord,
  PushSubscriptionKeys,
} from '../types';

function rowToCertificate(row: any): Certificate {
  return {
    id: row.id,
    title: row.title,
    issuer: row.issuer,
    issueDate: row.issue_date,
    category: row.category,
    description: row.description,
    fileData: row.file_data ?? undefined,
    fileName: row.file_name ?? undefined,
    fileType: row.file_type ?? undefined,
    skills: row.skills ?? [],
    credentialUrl: row.credential_url ?? undefined,
    credentialId: row.credential_id ?? undefined,
    hours: row.hours ?? undefined,
    isFavorite: row.is_favorite ?? undefined,
    createdAt: row.created_at,
  };
}

function certificateToRow(cert: Certificate, userId: string) {
  return {
    id: cert.id,
    user_id: userId,
    title: cert.title,
    issuer: cert.issuer,
    issue_date: cert.issueDate,
    category: cert.category,
    description: cert.description,
    file_data: cert.fileData ?? null,
    file_name: cert.fileName ?? null,
    file_type: cert.fileType ?? null,
    skills: cert.skills ?? [],
    credential_url: cert.credentialUrl ?? null,
    credential_id: cert.credentialId ?? null,
    hours: cert.hours ?? null,
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
const PROMPT_DOC_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

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
    // legacy rows uploaded before the migration to Supabase Storage
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

function rowToChatSession(row: any): ChatSession {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToChatMessage(row: any): ChatMessageRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    sender: row.sender,
    text: row.text,
    createdAt: row.created_at,
  };
}

function rowToUserBadge(row: any): UserBadge {
  return {
    badgeId: row.badge_id,
    unlockedAt: row.unlocked_at,
  };
}

function rowToChallenge(row: any): Challenge {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category ?? '',
    status: row.status,
    deadline: row.deadline ?? undefined,
    link: row.link ?? undefined,
    points: row.points ?? undefined,
    result: row.result ?? undefined,
    resultImage: row.result_image ?? undefined,
    resultLink: row.result_link ?? undefined,
    resultPlatform: row.result_platform ?? undefined,
    linkedPostId: row.linked_post_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function challengeToRow(challenge: Challenge, userId: string) {
  return {
    id: challenge.id,
    user_id: userId,
    title: challenge.title,
    description: challenge.description ?? '',
    category: challenge.category ?? '',
    status: challenge.status,
    deadline: challenge.deadline || null,
    link: challenge.link || null,
    points: challenge.points ?? null,
    result: challenge.result || null,
    result_image: challenge.resultImage || null,
    result_link: challenge.resultLink || null,
    result_platform: challenge.resultPlatform || null,
    linked_post_id: challenge.linkedPostId || null,
    created_at: challenge.createdAt,
    updated_at: challenge.updatedAt,
  };
}

function rowToGalleryPhoto(row: any): GalleryPhoto {
  return {
    id: row.id,
    imageData: row.image_data,
    caption: row.caption ?? '',
    category: row.category ?? '',
    takenAt: row.taken_at ?? undefined,
    createdAt: row.created_at,
  };
}

function galleryPhotoToRow(photo: GalleryPhoto, userId: string) {
  return {
    id: photo.id,
    user_id: userId,
    image_data: photo.imageData,
    caption: photo.caption ?? '',
    category: photo.category ?? '',
    taken_at: photo.takenAt || null,
    created_at: photo.createdAt,
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
    return (data ?? []).map(rowToCertificate);
  },

  async saveCertificate(cert: Certificate): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('certificates').upsert(certificateToRow(cert, userId));
    if (error) throw error;
  },

  async deleteCertificate(id: string): Promise<void> {
    const { error } = await supabase.from('certificates').delete().eq('id', id);
    if (error) throw error;
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
    return (data ?? []).map(rowToGalleryPhoto);
  },

  async saveGalleryPhoto(photo: GalleryPhoto): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('gallery_photos').upsert(galleryPhotoToRow(photo, userId));
    if (error) throw error;
  },

  async deleteGalleryPhoto(id: string): Promise<void> {
    const { error } = await supabase.from('gallery_photos').delete().eq('id', id);
    if (error) throw error;
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

  async listChatSessions(): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToChatSession);
  },

  async createChatSession(title: string): Promise<ChatSession> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title })
      .select('*')
      .single();
    if (error) throw error;
    return rowToChatSession(data);
  },

  async renameChatSession(id: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async touchChatSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteChatSession(id: string): Promise<void> {
    const { error } = await supabase.from('chat_sessions').delete().eq('id', id);
    if (error) throw error;
  },

  async getChatMessages(sessionId: string): Promise<ChatMessageRecord[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToChatMessage);
  },

  async appendChatMessage(sessionId: string, sender: 'user' | 'gemini', text: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from('chat_messages')
      .insert({ session_id: sessionId, user_id: userId, sender, text });
    if (error) throw error;
    await this.touchChatSession(sessionId);
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
    return (data ?? []).map(rowToCertificate);
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
    const [profile, certificates, prompts, posts, challenges, galleryPhotos] = await Promise.all([
      this.getProfile(),
      this.getCertificates(),
      this.getPrompts(),
      this.getPosts(),
      this.getChallenges(),
      this.getGalleryPhotos(),
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
      return true;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  },
};