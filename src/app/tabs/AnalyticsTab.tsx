import { AnalyticsDashboard } from '../../components/AnalyticsDashboard';
import { useCollectionData } from '../../data/queries';

export default function AnalyticsTab() {
  const certificates = useCollectionData('certificates');
  const posts = useCollectionData('posts');
  const sessions = useCollectionData('sessions');
  const challenges = useCollectionData('challenges');
  return <AnalyticsDashboard certificates={certificates} posts={posts} sessions={sessions} challenges={challenges} />;
}
