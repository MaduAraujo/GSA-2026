import { PromptsVaultModule } from '../../components/PromptsVaultModule';
import { useCollection, useCollectionData, useCollectionMutation } from '../../data/queries';
import { SupabaseStorageService as Storage } from '../../services/supabaseStorage';
import { useSyncBadges } from '../BadgeProvider';
import { TabSkeleton } from './TabSkeleton';

export default function PromptsTab() {
  const syncBadges = useSyncBadges();
  const prompts = useCollection('prompts');
  const promptDocs = useCollectionData('promptDocs');

  const savePrompt = useCollectionMutation(['prompts'], Storage.savePrompt, () => syncBadges({ silent: false }));
  const deletePrompt = useCollectionMutation(['prompts'], Storage.deletePrompt);
  const savePromptDoc = useCollectionMutation(['promptDocs'], Storage.savePromptDoc);
  const deletePromptDoc = useCollectionMutation(['promptDocs'], Storage.deletePromptDoc);

  if (prompts.isPending) return <TabSkeleton />;

  return (
    <PromptsVaultModule
      prompts={prompts.data ?? []}
      onSavePrompt={savePrompt}
      onDeletePrompt={deletePrompt}
      promptDocs={promptDocs}
      onSavePromptDoc={savePromptDoc}
      onDeletePromptDoc={deletePromptDoc}
    />
  );
}
