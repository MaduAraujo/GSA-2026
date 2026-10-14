import { supabase } from '../supabaseClient';
import type { SessionSummary } from '../../types';
import { getBatchSignedUrls, requireUserId, USER_FILES_BUCKET } from './files';
import { rowToSessionSummary } from './mappers';

export async function getSessionSummaries(): Promise<SessionSummary[]> {
  const { data, error } = await supabase.from('session_summaries').select('*');
  if (error) throw error;
  const rows = data ?? [];
  const signedUrls = await getBatchSignedUrls(
    USER_FILES_BUCKET,
    rows.map((r) => r.file_path),
  );
  return rows.map((row) => rowToSessionSummary(row, signedUrls));
}

export async function uploadSessionSummary(sessionId: string, file: File): Promise<void> {
  const userId = await requireUserId();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${userId}/session-summaries/${sessionId}-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(USER_FILES_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) throw uploadError;

  const { error } = await supabase
    .from('session_summaries')
    .insert({ user_id: userId, session_id: sessionId, file_path: path, file_name: file.name });
  if (error) {
    await supabase.storage.from(USER_FILES_BUCKET).remove([path]);
    throw error;
  }
}
