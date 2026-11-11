import { supabase } from '../supabaseClient';
import type { AmbassadorSession, Challenge, GalleryPhoto } from '../../types';
import type { Json } from '../../types/database';
import {
  getBatchSignedUrls,
  isDataUrl,
  removeUserFiles,
  requireUserId,
  uploadUserFile,
  USER_FILES_BUCKET,
} from './files';
import {
  challengeMediaOf,
  challengeToRow,
  galleryPhotoToRow,
  rowToChallenge,
  rowToGalleryPhoto,
  rowToSession,
  sessionToRow,
  storedChallengeMedia,
  storedSessionFiles,
  type StoredChallengeMedia,
  type StoredSessionFile,
} from './mappers';

export async function getChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const signedUrls = await getBatchSignedUrls(
    USER_FILES_BUCKET,
    rows.flatMap((r) => [r.result_image_path, ...storedChallengeMedia(r.media).map((m) => m.path)]),
  );
  return rows.map((row) => rowToChallenge(row, signedUrls));
}

const challengeFilePaths = (row: { media: Json | null; result_image_path: string | null } | null) =>
  [...storedChallengeMedia(row?.media).map((m) => m.path), row?.result_image_path].filter((p): p is string => !!p);

export async function saveChallenge(challenge: Challenge, mediaFiles: Record<string, File> = {}): Promise<void> {
  const userId = await requireUserId();
  const items = challengeMediaOf(challenge).filter(
    (item) => mediaFiles[item.id] || item.path || !item.url.startsWith('blob:'),
  );
  const media: StoredChallengeMedia[] = await Promise.all(
    items.map(async (item) => {
      const base = { id: item.id, name: item.name, kind: item.kind, mimeType: item.mimeType, fileSize: item.fileSize };
      const file = mediaFiles[item.id];
      if (file || isDataUrl(item.url)) {
        const path = `${userId}/challenges/${challenge.id}/media-${item.id}`;
        await uploadUserFile(file ?? item.url, path);
        return { ...base, path };
      }
      return item.path ? { ...base, path: item.path } : { ...base, url: item.url };
    }),
  );

  const { data: previous } = await supabase
    .from('challenges')
    .select('media, result_image_path')
    .eq('id', challenge.id)
    .maybeSingle();
  const { error } = await supabase.from('challenges').upsert(challengeToRow(challenge, userId, media));
  if (error) throw error;

  const kept = new Set(media.map((m) => m.path));
  await removeUserFiles(challengeFilePaths(previous).filter((path) => !kept.has(path)));
}

export async function deleteChallenge(id: string): Promise<void> {
  const userId = await requireUserId();
  const { data: row } = await supabase.from('challenges').select('media, result_image_path').eq('id', id).maybeSingle();
  const { error } = await supabase.from('challenges').delete().eq('id', id);
  if (error) throw error;
  await removeUserFiles(Array.from(new Set([`${userId}/challenges/${id}`, ...challengeFilePaths(row)])));
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase.from('gallery_photos').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const signedUrls = await getBatchSignedUrls(
    USER_FILES_BUCKET,
    rows.map((r) => r.image_path),
  );
  return rows.map((row) => rowToGalleryPhoto(row, signedUrls));
}

export async function saveGalleryPhoto(photo: GalleryPhoto, videoFile?: File): Promise<void> {
  const userId = await requireUserId();
  let imagePath: string | null = null;
  if (videoFile) {
    imagePath = `${userId}/gallery/${photo.id}`;
    await uploadUserFile(videoFile, imagePath);
  } else if (isDataUrl(photo.imageData)) {
    imagePath = `${userId}/gallery/${photo.id}`;
    await uploadUserFile(photo.imageData, imagePath);
  }
  const { error } = await supabase.from('gallery_photos').upsert(galleryPhotoToRow(photo, userId, imagePath));
  if (error) throw error;
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('gallery_photos').delete().eq('id', id);
  if (error) throw error;
  await removeUserFiles([`${userId}/gallery/${id}`]);
}

export async function getSessions(): Promise<AmbassadorSession[]> {
  const { data, error } = await supabase.from('sessions').select('*').order('session_date', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const allPaths = rows.flatMap((row) => [
    row.proof_image_path,
    ...storedSessionFiles(row.challenge_files).map((f) => f.path),
  ]);
  const signedUrls = await getBatchSignedUrls(USER_FILES_BUCKET, allPaths);
  return rows.map((row) => rowToSession(row, signedUrls));
}

export async function saveSession(session: AmbassadorSession, proofVideoFile?: File): Promise<void> {
  const userId = await requireUserId();
  const proofPath = `${userId}/sessions/${session.id}/proof`;

  let proofImagePath: string | null = null;
  if (proofVideoFile) {
    proofImagePath = proofPath;
    await uploadUserFile(proofVideoFile, proofImagePath);
  } else if (isDataUrl(session.proofImage)) {
    proofImagePath = proofPath;
    await uploadUserFile(session.proofImage, proofImagePath);
  } else if (session.proofImage) {
    proofImagePath = proofPath;
  }

  let challengeFilesForRow: StoredSessionFile[] | null = null;
  if (session.challengeFiles && session.challengeFiles.length > 0) {
    challengeFilesForRow = await Promise.all(
      session.challengeFiles.map(async (file) => {
        const path = `${userId}/sessions/${session.id}/challenge-${file.id}`;
        if (isDataUrl(file.dataUrl)) {
          await uploadUserFile(file.dataUrl, path);
        }
        return { id: file.id, name: file.name, fileType: file.fileType, fileSize: file.fileSize, path };
      }),
    );
  }

  const { error } = await supabase
    .from('sessions')
    .upsert(sessionToRow(session, userId, proofImagePath, challengeFilesForRow));
  if (error) throw error;
}

export async function deleteSession(id: string): Promise<void> {
  const userId = await requireUserId();
  const { data: row } = await supabase.from('sessions').select('challenge_files').eq('id', id).maybeSingle();
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) throw error;
  const attachmentPaths = storedSessionFiles(row?.challenge_files)
    .map((f) => f.path)
    .filter((p): p is string => !!p);
  await removeUserFiles([`${userId}/sessions/${id}/proof`, ...attachmentPaths]);
}
