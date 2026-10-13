import type { SessionFile } from '../../types';

export const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
export const MAX_PROOF_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // Supabase Free plan caps uploads at 50MB
export const MAX_ATTACHMENT_SIZE_BYTES = 8 * 1024 * 1024;

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function isImageFile(file: SessionFile): boolean {
  return file.fileType.startsWith('image/');
}

export function splitAttachments(files: SessionFile[] = []) {
  return {
    images: files.filter(isImageFile),
    documents: files.filter((f) => !isImageFile(f)),
  };
}
