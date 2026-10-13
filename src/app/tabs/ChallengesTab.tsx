import { ChallengesModule } from '../../components/ChallengesModule';
import { useCollection, useCollectionData, useCollectionMutation } from '../../data/queries';
import { SupabaseStorageService as Storage } from '../../services/supabaseStorage';
import { TabSkeleton } from './TabSkeleton';
import { usePostMutations } from './usePostMutations';

export default function ChallengesTab() {
  const challenges = useCollection('challenges');
  const posts = useCollectionData('posts');
  const saveChallenge = useCollectionMutation(['challenges'], Storage.saveChallenge);
  const deleteChallenge = useCollectionMutation(['challenges'], Storage.deleteChallenge);
  const { savePost, deletePost } = usePostMutations();

  if (challenges.isPending) return <TabSkeleton />;

  return (
    <ChallengesModule
      challenges={challenges.data ?? []}
      posts={posts}
      onSaveChallenge={saveChallenge}
      onDeleteChallenge={deleteChallenge}
      onSavePost={savePost}
      onDeletePost={deletePost}
    />
  );
}
