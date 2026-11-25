function readRedirectParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  const { hash, search } = window.location;
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : '');
  new URLSearchParams(search).forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });
  return params;
}

const params = readRedirectParams();

export const arrivedFromRecoveryLink = params.get('type') === 'recovery';

export const recoveryTokenHash = arrivedFromRecoveryLink ? params.get('token_hash') : null;

let pendingLinkError = Boolean(params.get('error_code') || params.get('error'));

export function markLinkError(): void {
  pendingLinkError = true;
}

export function clearAuthParamsFromUrl(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  ['token_hash', 'type', 'error', 'error_code', 'error_description'].forEach((key) => url.searchParams.delete(key));
  url.hash = '';
  window.history.replaceState(window.history.state, '', url.pathname + url.search);
}

export function hasPendingLinkError(): boolean {
  return pendingLinkError;
}

export function consumeLinkError(): string | null {
  if (!pendingLinkError) return null;
  pendingLinkError = false;
  clearAuthParamsFromUrl();
  return 'Este link expirou ou já foi usado. Para redefinir a senha, peça um novo link em "Esqueceu a senha?". Para confirmar o cadastro, tente entrar e reenvie o e-mail de confirmação.';
}
