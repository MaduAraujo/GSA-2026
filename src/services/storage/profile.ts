import { supabase } from '../supabaseClient';
import type { AmbassadorProfile, Certificate, UserBadge } from '../../types';
import { getBatchSignedUrls, requireUserId, USER_FILES_BUCKET } from './files';
import { EMPTY_PROFILE, profileToRow, rowToCertificate, rowToProfile, rowToUserBadge } from './mappers';

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

export async function getPublicProfileBySlug(
  slug: string,
): Promise<{ userId: string; profile: AmbassadorProfile } | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('public_slug', slug).maybeSingle();
  if (error) throw error;
  return data ? { userId: data.id, profile: rowToProfile(data) } : null;
}

export async function getPublicCertificates(userId: string): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .order('issue_date', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const signedUrls = await getBatchSignedUrls(
    USER_FILES_BUCKET,
    rows.map((r) => r.file_path),
  );
  return rows.map((row) => rowToCertificate(row, signedUrls));
}
