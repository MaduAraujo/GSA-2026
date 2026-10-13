import { useLocation } from 'react-router';
import { PostsModule } from '../../components/PostsModule';
import { useCollection } from '../../data/queries';
import { TabSkeleton } from './TabSkeleton';
import { usePostMutations } from './usePostMutations';

export default function PostsTab() {
  const location = useLocation();
  const draftTopic = (location.state as { draftTopic?: string } | null)?.draftTopic ?? '';
  const posts = useCollection('posts');
  const { savePost, deletePost } = usePostMutations();

  if (posts.isPending) return <TabSkeleton />;

  return (
    <PostsModule
      posts={posts.data ?? []}
      onSavePost={savePost}
      onDeletePost={deletePost}
      initialDraftTopic={draftTopic}
    />
  );
}
