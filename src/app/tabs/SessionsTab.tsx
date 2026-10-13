import { SessionsModule } from '../../components/SessionsModule';
import { useCollection, useCollectionMutation } from '../../data/queries';
import { SupabaseStorageService as Storage } from '../../services/supabaseStorage';
import { TabSkeleton } from './TabSkeleton';

export default function SessionsTab() {
  const sessions = useCollection('sessions');
  const saveSession = useCollectionMutation(['sessions'], Storage.saveSession);
  const deleteSession = useCollectionMutation(['sessions'], Storage.deleteSession);

  if (sessions.isPending) return <TabSkeleton />;
  return <SessionsModule sessions={sessions.data ?? []} onSaveSession={saveSession} onDeleteSession={deleteSession} />;
}
