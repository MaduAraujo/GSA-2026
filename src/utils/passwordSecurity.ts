export async function isPasswordLeaked(password: string): Promise<boolean> {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-1', encoded);
  const hashHex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) return false;

    const body = await response.text();
    return body.split('\n').some((line) => line.split(':')[0].trim() === suffix);
  } catch {
    return false;
  }
}