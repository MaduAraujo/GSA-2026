import { z } from 'zod';
import type {
  AmbassadorProfile,
  AmbassadorSession,
  Certificate,
  Challenge,
  GalleryPhoto,
  HostedEvent,
  ProgramDeadline,
  PromptItem,
  ReferenceLink,
  SocialPost,
  WeeklyScore,
} from '../../types';
import { getCertificates, saveCertificate } from './certificates';
import { getChallenges, getGalleryPhotos, getSessions, saveChallenge, saveGalleryPhoto, saveSession } from './media';
import { getPosts, savePost } from './posts';
import { getProfile, saveProfile } from './profile';
import {
  getHostedEvents,
  getProgramDeadlines,
  getReferenceLinks,
  getWeeklyScores,
  saveHostedEvent,
  saveProgramDeadline,
  saveReferenceLink,
  saveWeeklyScore,
} from './program';
import { getPrompts, savePrompt } from './prompts';

const record = <T>() => z.looseObject({ id: z.string() }).transform((value) => value as unknown as T);
const list = <T>() => z.array(record<T>()).optional();

const backupSchema = z.object({
  profile: z
    .looseObject({ name: z.string() })
    .transform((value) => value as unknown as AmbassadorProfile)
    .optional(),
  certificates: list<Certificate>(),
  prompts: list<PromptItem>(),
  challenges: list<Challenge>(),
  posts: list<SocialPost>(),
  galleryPhotos: list<GalleryPhoto>(),
  sessions: list<AmbassadorSession>(),
  weeklyScores: list<WeeklyScore>(),
  referenceLinks: list<ReferenceLink>(),
  programDeadlines: list<ProgramDeadline>(),
  hostedEvents: list<HostedEvent>(),
});

export async function exportAllData(): Promise<string> {
  const [
    profile,
    certificates,
    prompts,
    posts,
    challenges,
    galleryPhotos,
    sessions,
    weeklyScores,
    referenceLinks,
    programDeadlines,
    hostedEvents,
  ] = await Promise.all([
    getProfile(),
    getCertificates(),
    getPrompts(),
    getPosts(),
    getChallenges(),
    getGalleryPhotos(),
    getSessions(),
    getWeeklyScores(),
    getReferenceLinks(),
    getProgramDeadlines(),
    getHostedEvents(),
  ]);

  return JSON.stringify(
    {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      profile,
      certificates,
      prompts,
      posts,
      challenges,
      galleryPhotos,
      sessions,
      weeklyScores,
      referenceLinks,
      programDeadlines,
      hostedEvents,
    },
    null,
    2,
  );
}

async function saveEach<T>(items: T[] | undefined, save: (item: T) => Promise<void>) {
  for (const item of items ?? []) {
    await save(item);
  }
}

export async function importAllData(jsonString: string): Promise<boolean> {
  try {
    const backup = backupSchema.parse(JSON.parse(jsonString));
    if (backup.profile) await saveProfile(backup.profile);
    await saveEach(backup.certificates, saveCertificate);
    await saveEach(backup.prompts, savePrompt);
    await saveEach(backup.challenges, (c) => saveChallenge(c));
    await saveEach(backup.posts, savePost);
    await saveEach(backup.galleryPhotos, (p) => saveGalleryPhoto(p));
    await saveEach(backup.sessions, (s) => saveSession(s));
    await saveEach(backup.weeklyScores, saveWeeklyScore);
    await saveEach(backup.referenceLinks, saveReferenceLink);
    await saveEach(backup.programDeadlines, saveProgramDeadline);
    await saveEach(backup.hostedEvents, saveHostedEvent);
    return true;
  } catch (e) {
    console.error('Error importing backup:', e);
    return false;
  }
}
