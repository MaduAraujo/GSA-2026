import { supabase } from '../supabaseClient';
import type { AmbassadorProfile, UserBadge } from '../../types';
import { requireUserId } from './files';
import { EMPTY_PROFILE, profileToRow, rowToProfile, rowToUserBadge } from './mappers';

function metadataName(metadata: Record<string, unknown> | undefined): string {
  const value = metadata?.full_name ?? metadata?.name;
  return typeof value === 'string' ? value.trim() : '';
}

export async function getProfile(): Promise<AmbassadorProfile> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error('Não autenticado.');
  const { data, error } = await supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle();
  if (error) throw error;
  const profile = data ? rowToProfile(data) : { ...EMPTY_PROFILE };
  if (!profile.name.trim()) profile.name = metadataName(auth.user.user_metadata);
  return profile;
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
