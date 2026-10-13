import { supabase } from '../supabaseClient';

export const USER_FILES_BUCKET = 'user-files';
export const PROMPT_DOCS_BUCKET = 'prompt-docs';
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

export function isDataUrl(value?: string | null): value is string {
  return !!value && value.startsWith('data:');
}

export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Não autenticado.');
  return data.user.id;
}

export async function uploadUserFile(source: string | File, path: string): Promise<void> {
  const body = typeof source === 'string' ? await (await fetch(source)).blob() : source;
  const { error } = await supabase.storage
    .from(USER_FILES_BUCKET)
    .upload(path, body, { upsert: true, contentType: body.type || undefined });
  if (error) throw error;
}

export async function getBatchSignedUrls(
  bucket: string,
  paths: Array<string | null | undefined>,
  ttlSeconds = SIGNED_URL_TTL_SECONDS,
): Promise<Map<string, string>> {
  const uniquePaths = Array.from(new Set(paths.filter((p): p is string => !!p)));
  const map = new Map<string, string>();
  if (uniquePaths.length === 0) return map;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(uniquePaths, ttlSeconds);
  if (error) throw error;

  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}

export async function removeUserFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(USER_FILES_BUCKET).remove(paths);
}
