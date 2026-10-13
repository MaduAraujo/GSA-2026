import { GalleryModule } from '../../components/GalleryModule';
import { useCollection, useCollectionMutation } from '../../data/queries';
import { SupabaseStorageService as Storage } from '../../services/supabaseStorage';
import { TabSkeleton } from './TabSkeleton';

export default function GalleryTab() {
  const photos = useCollection('galleryPhotos');
  const savePhoto = useCollectionMutation(['galleryPhotos'], Storage.saveGalleryPhoto);
  const deletePhoto = useCollectionMutation(['galleryPhotos'], Storage.deleteGalleryPhoto);

  if (photos.isPending) return <TabSkeleton />;
  return <GalleryModule photos={photos.data ?? []} onSavePhoto={savePhoto} onDeletePhoto={deletePhoto} />;
}
