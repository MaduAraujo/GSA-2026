const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

export function isHttpUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    return SAFE_PROTOCOLS.has(new URL(url, window.location.origin).protocol);
  } catch {
    return false;
  }
}
