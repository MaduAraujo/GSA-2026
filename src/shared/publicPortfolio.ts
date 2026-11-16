export interface PublicPortfolio {
  profile: {
    name: string;
    role: string;
    university: string;
    avatarUrl: string;
  };
  certificates: Array<{
    id: string;
    title: string;
    issuer: string;
    issueDate: string;
    description: string;
    hours?: number;
    minutes?: number;
    credentialUrl?: string;
  }>;
  badges: Array<{
    id: string;
    fileName: string;
    url?: string;
  }>;
}

export const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
