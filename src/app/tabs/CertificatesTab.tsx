import { useNavigate } from 'react-router';
import { CertificatesModule } from '../../components/CertificatesModule';
import { useCollection, useCollectionMutation, useProfile } from '../../data/queries';
import { TAB_PATHS } from '../../routes';
import { SupabaseStorageService as Storage } from '../../services/supabaseStorage';
import type { Certificate } from '../../types';
import { useSyncBadges } from '../BadgeProvider';
import { TabSkeleton } from './TabSkeleton';

export default function CertificatesTab() {
  const navigate = useNavigate();
  const syncBadges = useSyncBadges();
  const certificates = useCollection('certificates');
  const earnedBadges = useCollection('earnedBadges');
  const { data: profile } = useProfile();

  const saveCertificate = useCollectionMutation(['certificates'], Storage.saveCertificate, () =>
    syncBadges({ silent: false }),
  );
  const toggleCertificateFavorite = useCollectionMutation(['certificates'], Storage.setCertificateFavorite, () =>
    syncBadges({ silent: false }),
  );
  const setCertificatePortfolioVisibility = useCollectionMutation(
    ['certificates'],
    Storage.setCertificatePortfolioVisibility,
  );
  const deleteCertificate = useCollectionMutation(['certificates'], Storage.deleteCertificate);
  const uploadEarnedBadge = useCollectionMutation(['earnedBadges'], Storage.uploadEarnedBadge);
  const deleteEarnedBadge = useCollectionMutation(['earnedBadges'], Storage.deleteEarnedBadge);
  const toggleEarnedBadgeFavorite = useCollectionMutation(['earnedBadges'], Storage.setEarnedBadgeFavorite);

  if (certificates.isPending || !profile) return <TabSkeleton />;

  return (
    <CertificatesModule
      certificates={certificates.data ?? []}
      earnedBadges={earnedBadges.data ?? []}
      isEarnedBadgesLoading={earnedBadges.isPending}
      profile={profile}
      onUploadEarnedBadge={uploadEarnedBadge}
      onDeleteEarnedBadge={deleteEarnedBadge}
      onToggleEarnedBadgeFavorite={toggleEarnedBadgeFavorite}
      onSaveCertificate={saveCertificate}
      onToggleCertificateFavorite={toggleCertificateFavorite}
      onToggleCertificatePortfolio={setCertificatePortfolioVisibility}
      onDeleteCertificate={deleteCertificate}
      onCreatePostFromCertificate={(cert: Certificate) =>
        navigate(TAB_PATHS.posts, {
          state: { draftTopic: `Conquista do certificado oficial: "${cert.title}" emitido por ${cert.issuer}` },
        })
      }
    />
  );
}
