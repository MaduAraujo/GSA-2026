import { StudyGuideModule } from '../../components/studyGuide/StudyGuideModule';
import { useCollection, useCollectionMutation } from '../../data/queries';
import { SupabaseStorageService as Storage } from '../../services/supabaseStorage';
import { TabSkeleton } from './TabSkeleton';

export default function StudyGuideTab() {
  const events = useCollection('hostedEvents');
  const saveEvent = useCollectionMutation(['hostedEvents'], Storage.saveHostedEvent);
  const deleteEvent = useCollectionMutation(['hostedEvents'], Storage.deleteHostedEvent);

  if (events.isPending) return <TabSkeleton />;
  return <StudyGuideModule events={events.data ?? []} onSaveEvent={saveEvent} onDeleteEvent={deleteEvent} />;
}
