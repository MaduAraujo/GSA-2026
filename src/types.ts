// Freeform: the user types their own category when creating a certificate
// (e.g. "Onboarding"), so this isn't a fixed set of options.
export type CertificateCategory = string;

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  category: CertificateCategory;
  description: string;
  fileData?: string; // base64 or object URL
  fileName?: string;
  fileType?: 'image' | 'pdf' | 'document';
  skills: string[];
  credentialUrl?: string;
  credentialId?: string;
  hours?: number;
  isFavorite?: boolean;
  createdAt: string;
}

export type CertificateItem = Certificate;

export type PromptSection =
  | 'Estudos'
  | 'Workshops & Eventos'
  | 'Criação de Conteúdo'
  | 'Carreira Tech'
  | 'Pesquisa & IA'
  | 'Comunidade & Liderança';

export interface PromptItem {
  id: string;
  title: string;
  promptText: string;
  section: PromptSection;
  description?: string;
  tags: string[];
  variables?: string[];
  recommendedModel: 'gemini-3.7-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';
  isFavorite?: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
}

export type PostPlatform = 'LinkedIn' | 'Instagram' | 'Medium / Dev.to' | 'Twitter / X' | 'WhatsApp / Comunidade';
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
}
