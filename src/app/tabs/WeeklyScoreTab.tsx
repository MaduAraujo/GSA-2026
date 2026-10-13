import { WeeklyScoreModule } from '../../components/WeeklyScoreModule';
import { useCollection, useCollectionMutation } from '../../data/queries';
import { SupabaseStorageService as Storage } from '../../services/supabaseStorage';
import { TabSkeleton } from './TabSkeleton';

export default function WeeklyScoreTab() {
  const weeklyScores = useCollection('weeklyScores');
  const saveWeeklyScore = useCollectionMutation(['weeklyScores'], Storage.saveWeeklyScore);
  const deleteWeeklyScore = useCollectionMutation(['weeklyScores'], Storage.deleteWeeklyScore);

  if (weeklyScores.isPending) return <TabSkeleton />;
  return (
    <WeeklyScoreModule
      weeklyScores={weeklyScores.data ?? []}
      onSaveWeeklyScore={saveWeeklyScore}
      onDeleteWeeklyScore={deleteWeeklyScore}
    />
  );
}
