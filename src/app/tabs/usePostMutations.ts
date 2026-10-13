import { useCollectionMutation } from '../../data/queries';
import { SupabaseStorageService as Storage } from '../../services/supabaseStorage';
import { useSyncBadges } from '../BadgeProvider';

export function usePostMutations() {
  const syncBadges = useSyncBadges();
  const savePost = useCollectionMutation(['posts'], Storage.savePost, () => syncBadges({ silent: false }));
  const deletePost = useCollectionMutation(['posts'], Storage.deletePost);
  return { savePost, deletePost };
}
