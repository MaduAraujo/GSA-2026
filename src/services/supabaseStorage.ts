import * as certificates from './storage/certificates';
import * as media from './storage/media';
import * as posts from './storage/posts';
import * as profile from './storage/profile';
import * as program from './storage/program';
import * as prompts from './storage/prompts';
import * as push from './storage/push';

export const SupabaseStorageService = {
  ...profile,
  ...certificates,
  ...prompts,
  ...posts,
  ...media,
  ...program,
  ...push,
  exportAllData: async () => (await import('./storage/backup')).exportAllData(),
  importAllData: async (json: string) => (await import('./storage/backup')).importAllData(json),
};
