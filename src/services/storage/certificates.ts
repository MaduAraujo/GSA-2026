import { supabase } from '../supabaseClient';
import type { Certificate } from '../../types';
import {
  getBatchSignedUrls,
  isDataUrl,
  removeUserFiles,
  requireUserId,
  uploadUserFile,
  USER_FILES_BUCKET,
} from './files';
import { certificateToRow, rowToCertificate } from './mappers';

export async function getCertificates(): Promise<Certificate[]> {
  const { data, error } = await supabase.from('certificates').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const signedUrls = await getBatchSignedUrls(
    USER_FILES_BUCKET,
    rows.map((r) => r.file_path),
  );
  return rows.map((row) => rowToCertificate(row, signedUrls));
}

export async function saveCertificate(cert: Certificate): Promise<void> {
  const userId = await requireUserId();
  let filePath: string | null = null;
  if (isDataUrl(cert.fileData)) {
    filePath = `${userId}/certificates/${cert.id}`;
    await uploadUserFile(cert.fileData, filePath);
  } else if (cert.fileData) {
    filePath = `${userId}/certificates/${cert.id}`;
  }
  const { error } = await supabase.from('certificates').upsert(certificateToRow(cert, userId, filePath));
  if (error) throw error;
}

export async function deleteCertificate(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('certificates').delete().eq('id', id);
  if (error) throw error;
  await removeUserFiles([`${userId}/certificates/${id}`]);
}
