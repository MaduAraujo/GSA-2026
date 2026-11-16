import { supabase, supabaseAnonKey, supabaseUrl } from '../supabaseClient';

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

export interface UploadProgressOptions {
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}

export class UploadAbortedError extends Error {
  constructor() {
    super('Envio cancelado.');
    this.name = 'UploadAbortedError';
  }
}

export async function uploadFileWithProgress(
  bucket: string,
  path: string,
  file: File,
  { onProgress, signal }: UploadProgressOptions = {},
): Promise<void> {
  if (signal?.aborted) throw new UploadAbortedError();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Não autenticado.');

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    xhr.open('POST', `${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', supabaseAnonKey ?? '');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('cache-control', 'max-age=3600');
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);

    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const cleanup = () => signal?.removeEventListener('abort', onAbort);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded, e.total);
    };
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(file.size, file.size);
        resolve();
        return;
      }
      let message = `Falha no envio (HTTP ${xhr.status}).`;
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        message = body.message || body.error || message;
      } catch {}
      reject(new Error(message));
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error('Falha de rede durante o envio.'));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new UploadAbortedError());
    };
    xhr.send(file);
  });
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
