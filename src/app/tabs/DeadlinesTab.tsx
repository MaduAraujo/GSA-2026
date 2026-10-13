import { DeadlinesModule } from '../../components/DeadlinesModule';
import { useCollection, useCollectionMutation } from '../../data/queries';
import { SupabaseStorageService as Storage } from '../../services/supabaseStorage';
import { TabSkeleton } from './TabSkeleton';

export default function DeadlinesTab() {
  const deadlines = useCollection('deadlines');
  const saveDeadline = useCollectionMutation(['deadlines'], Storage.saveProgramDeadline);
  const deleteDeadline = useCollectionMutation(['deadlines'], Storage.deleteProgramDeadline);

  if (deadlines.isPending) return <TabSkeleton />;
  return (
    <DeadlinesModule deadlines={deadlines.data ?? []} onSaveDeadline={saveDeadline} onDeleteDeadline={deleteDeadline} />
  );
}
