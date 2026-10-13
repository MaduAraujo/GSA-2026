import { supabase } from '../supabaseClient';
import type { PushSubscriptionKeys } from '../../types';
import { requireUserId } from './files';

export async function savePushSubscription(keys: PushSubscriptionKeys): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: userId, endpoint: keys.endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'endpoint' },
    );
  if (error) throw error;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) throw error;
}

export async function listPushSubscriptions(): Promise<PushSubscriptionKeys[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth }));
}
