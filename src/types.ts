export type CertificateCategory = string;

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  category: CertificateCategory;
  description: string;
  fileData?: string; 
  fileName?: string;
  fileType?: 'image' | 'pdf' | 'document';
  skills: string[];
  credentialUrl?: string;
  credentialId?: string;
  hours?: number;
  minutes?: number;
  isFavorite?: boolean;
  createdAt: string;
}

export type CertificateItem = Certificate;
export type PromptSection = string;

export interface PromptItem {
  id: string;
  title: string;
  promptText: string;
  section: PromptSection;
  description?: string;
  tags: string[];
  variables?: string[];
  sharedDocs?: string[];
  recommendedModel: 'gemini-3.7-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';
  isFavorite?: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
}

export interface PromptDoc {
  id: string;
  name: string;
  filePath: string;
  fileData?: string;
  downloadUrl?: string;
  fileType: string;
  fileSize?: number;
  createdAt: string;
}

export type PostPlatform = 'LinkedIn' | 'Instagram' | 'WhatsApp / Comunidade';
export type PostStatus = 'Rascunho' | 'Agendado' | 'Publicado';

export interface GeminiPost {
  id: string;
  title: string;
  platform: PostPlatform;
  status: PostStatus;
  category: string;
  tone: string;
  content: string;
  promptUsed?: string;
  hashtags: string[];
  visualIdea?: string;
  scheduledDate?: string;
  publishedUrl?: string;
  likes?: number;
  comments?: number;
  score?: number;
  socialLinks?: ChallengeSocialLink[];
  createdAt: string;
  updatedAt: string;
}

export type ChallengeStatus = 'Pendente' | 'Em Andamento' | 'Concluído';

export type ChallengeCategory = string;

export interface ChallengeSocialLink {
  id: string;
  platform: PostPlatform;
  link: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  status: ChallengeStatus;
  /** @deprecated kept for old rows; use `dates` (first entry) instead */
  deadline?: string;
  dates?: string[];
  link?: string;
  points?: number;
  result?: string;
  resultImage?: string;
  /** @deprecated kept for old rows; use `socialLinks` instead */
  resultLink?: string;
  /** @deprecated kept for old rows; use `socialLinks` instead */
  resultPlatform?: PostPlatform;
  socialLinks?: ChallengeSocialLink[];
  /** @deprecated kept for old rows; use `linkedPostIds` instead */
  linkedPostId?: string;
  linkedPostIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type GalleryCategory = string;

export interface GalleryPhoto {
  id: string;
  imageData: string;
  caption: string;
  category: GalleryCategory;
  takenAt?: string;
  createdAt: string;
}

export interface SessionFile {
  id: string;
  name: string;
  dataUrl: string;
  fileType: string;
  fileSize?: number;
}

export interface AmbassadorSession {
  id: string;
  title: string;
  date: string;
  challenge?: string;
  challengeFiles?: SessionFile[];
  toolLearned: string;
  proofImage?: string;
  score?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  badgeId: string;
  unlockedAt: string;
}

export interface AmbassadorProfile {
  name: string;
  role: string;
  cohort?: string;
  university: string;
  course: string;
  bio: string;
  avatarUrl: string;
  email?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  instagramUrl?: string;
  goal2026: string;
  isPublic?: boolean;
  publicSlug?: string;
}

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}