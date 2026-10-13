import { ReferenceLinksModule } from '../../components/ReferenceLinksModule';
import { useCollection, useCollectionMutation } from '../../data/queries';
import { SupabaseStorageService as Storage } from '../../services/supabaseStorage';
import { TabSkeleton } from './TabSkeleton';

export default function ReferenceLinksTab() {
  const referenceLinks = useCollection('referenceLinks');
  const saveReferenceLink = useCollectionMutation(['referenceLinks'], Storage.saveReferenceLink);
  const deleteReferenceLink = useCollectionMutation(['referenceLinks'], Storage.deleteReferenceLink);

  if (referenceLinks.isPending) return <TabSkeleton />;
  return (
    <ReferenceLinksModule
      referenceLinks={referenceLinks.data ?? []}
      onSaveReferenceLink={saveReferenceLink}
      onDeleteReferenceLink={deleteReferenceLink}
    />
  );
}
