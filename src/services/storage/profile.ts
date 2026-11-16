import { supabase } from '../supabaseClient';
import type { AmbassadorProfile, UserBadge } from '../../types';
import { requireUserId } from './files';
import { EMPTY_PROFILE, profileToRow, rowToProfile, rowToUserBadge } from './mappers';

export async function getProfile(): Promise<AmbassadorProfile> {
  const userId = await requireUserId();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? rowToProfile(data) : { ...EMPTY_PROFILE };
}

export async function saveProfile(profile: AmbassadorProfile): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('profiles').upsert(profileToRow(profile, userId));
  if (error) throw error;
}

export async function getUserBadges(): Promise<UserBadge[]> {
  const { data, error } = await supabase.from('user_badges').select('*').order('unlocked_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToUserBadge);
}

export async function unlockBadge(badgeId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('user_badges')
    .upsert(
      { user_id: userId, badge_id: badgeId, unlocked_at: new Date().toISOString() },
      { onConflict: 'user_id,badge_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}
