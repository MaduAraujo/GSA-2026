import * as certificates from './storage/certificates';
import * as levelBadges from './storage/levelBadges';
import * as media from './storage/media';
import * as posts from './storage/posts';
import * as profile from './storage/profile';
import * as program from './storage/program';
import * as prompts from './storage/prompts';
import * as push from './storage/push';
import * as sessionSummaries from './storage/sessionSummaries';

export const SupabaseStorageService = {
  ...profile,
  ...certificates,
  ...prompts,
  ...posts,
  ...media,
  ...program,
  ...push,
  ...sessionSummaries,
  ...levelBadges,
  exportAllData: async () => (await import('./storage/backup')).exportAllData(),
  importAllData: async (json: string) => (await import('./storage/backup')).importAllData(json),
};
