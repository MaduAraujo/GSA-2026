import { supabase } from '../supabaseClient';
import type { LevelBadge } from '../../types';
import { getBatchSignedUrls, removeUserFiles, requireUserId, USER_FILES_BUCKET } from './files';
import { rowToLevelBadge } from './mappers';

export async function getLevelBadges(): Promise<LevelBadge[]> {
  const { data, error } = await supabase.from('level_badges').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const signedUrls = await getBatchSignedUrls(
    USER_FILES_BUCKET,
    rows.map((r) => r.file_path),
  );
  return rows.map((row) => rowToLevelBadge(row, signedUrls));
}

export async function uploadLevelBadge(level: number, file: File): Promise<void> {
  const userId = await requireUserId();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${userId}/level-badges/${level}-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(USER_FILES_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) throw uploadError;

  const { error } = await supabase
    .from('level_badges')
    .insert({ user_id: userId, level, file_path: path, file_name: file.name });
  if (error) {
    await supabase.storage.from(USER_FILES_BUCKET).remove([path]);
    throw error;
  }
}

export async function deleteLevelBadge(badge: LevelBadge): Promise<void> {
  const { error } = await supabase.from('level_badges').delete().eq('id', badge.id);
  if (error) throw error;
  await removeUserFiles([badge.filePath]);
}
