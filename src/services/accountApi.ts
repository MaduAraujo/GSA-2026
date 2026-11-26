import { getAuthHeaders, supabase } from './supabaseClient';

export const ACCOUNT_DELETE_CONFIRMATION = 'EXCLUIR';

export async function deleteAccount(): Promise<void> {
  const res = await fetch('/api/account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify({ confirmation: ACCOUNT_DELETE_CONFIRMATION }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: unknown };
    throw new Error(
      typeof err.error === 'string' && err.error ? err.error : 'Não foi possível excluir a conta. Tente novamente.',
    );
  }
  await supabase.auth.signOut({ scope: 'local' });
}
