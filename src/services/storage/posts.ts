import { supabase } from '../supabaseClient';
import type { SocialPost } from '../../types';
import { requireUserId } from './files';
import { postToRow, rowToPost } from './mappers';

export async function getPosts(): Promise<SocialPost[]> {
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToPost);
}

export async function savePost(post: SocialPost): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('posts').upsert(postToRow(post, userId));
  if (error) throw error;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}
