import type { GalleryPhoto } from '../../types';

export const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;

const MAX_DIMENSION = 2048;
const WEBP_QUALITY = 0.85;

const toMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

export type MediaKind = 'image' | 'video';

export function mediaKindOf(file: File): MediaKind | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return null;
}

export function validateMediaFile(file: File): string | null {
  const kind = mediaKindOf(file);
  if (!kind) return `“${file.name}” não é uma imagem (PNG, JPG, WebP) nem um vídeo.`;
  if (kind === 'image' && file.size > MAX_SOURCE_IMAGE_SIZE_BYTES) {
    return `Imagem muito grande (${toMB(file.size)}MB). O limite é 25MB.`;
  }
  if (kind === 'video' && file.size > MAX_VIDEO_SIZE_BYTES) {
    return `Vídeo muito grande (${toMB(file.size)}MB). O limite é 50MB.`;
  }
  return null;
}

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(blob);
  });

export async function prepareImage(file: File): Promise<string> {
  const keepOriginal = async () => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`Imagem muito grande (${toMB(file.size)}MB) e não foi possível comprimi-la. O limite é 4MB.`);
    }
    return readAsDataUrl(file);
  };

  if (file.type === 'image/gif' || file.type === 'image/svg+xml' || typeof createImageBitmap !== 'function') {
    return keepOriginal();
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return keepOriginal();
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return keepOriginal();
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));
  if (!blob || (blob.size >= file.size && file.size <= MAX_IMAGE_SIZE_BYTES)) return keepOriginal();
  if (blob.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Mesmo comprimida, a imagem passou de 4MB. Tente uma foto menor.');
  }
  return readAsDataUrl(blob);
}

const EXIF_TAG_DATETIME = 0x0132;
const EXIF_TAG_IFD_POINTER = 0x8769;
const EXIF_TAG_DATETIME_ORIGINAL = 0x9003;

export function readExifDate(buffer: ArrayBuffer): string | undefined {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return undefined;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    const length = view.getUint16(offset + 2);
    if (marker === 0xffe1 && offset + 10 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966) {
      return readTiffDate(view, offset + 10);
    }
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return undefined;
    offset += 2 + length;
  }
  return undefined;
}

function readTiffDate(view: DataView, tiff: number): string | undefined {
  try {
    const little = view.getUint16(tiff) === 0x4949;
    const u16 = (at: number) => view.getUint16(at, little);
    const u32 = (at: number) => view.getUint32(at, little);

    const findTag = (ifd: number, tag: number) => {
      const count = u16(ifd);
      for (let i = 0; i < count; i++) {
        const entry = ifd + 2 + i * 12;
        if (u16(entry) === tag) return entry;
      }
      return undefined;
    };
    const readAscii = (entry: number) => {
      const start = tiff + u32(entry + 8);
      let text = '';
      for (let i = 0; i < 19; i++) text += String.fromCharCode(view.getUint8(start + i));
      return text;
    };

    const ifd0 = tiff + u32(tiff + 4);
    const exifPointer = findTag(ifd0, EXIF_TAG_IFD_POINTER);
    const original = exifPointer ? findTag(tiff + u32(exifPointer + 8), EXIF_TAG_DATETIME_ORIGINAL) : undefined;
    const entry = original ?? findTag(ifd0, EXIF_TAG_DATETIME);
    if (!entry) return undefined;

    const match = /^(\d{4}):(\d{2}):(\d{2})/.exec(readAscii(entry));
    if (!match || match[1] === '0000') return undefined;
    return `${match[1]}-${match[2]}-${match[3]}`;
  } catch {
    return undefined;
  }
}

const isoDateOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export async function detectCaptureDate(file: File): Promise<string | undefined> {
  if (file.type === 'image/jpeg') {
    try {
      const fromExif = readExifDate(await file.slice(0, 128 * 1024).arrayBuffer());
      if (fromExif) return fromExif;
    } catch {}
  }
  return file.lastModified ? isoDateOf(new Date(file.lastModified)) : undefined;
}

export const photoDate = (photo: GalleryPhoto) => photo.takenAt || photo.createdAt.slice(0, 10);

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export interface PhotoGroup {
  key: string;
  label: string;
  photos: GalleryPhoto[];
}

export function groupByMonth(photos: GalleryPhoto[]): PhotoGroup[] {
  const groups: PhotoGroup[] = [];
  for (const photo of photos) {
    const key = photoDate(photo).slice(0, 7);
    let group = groups[groups.length - 1];
    if (group?.key !== key) {
      const [year, month] = key.split('-');
      group = { key, label: `${MONTHS[Number(month) - 1] ?? ''} de ${year}`, photos: [] };
      groups.push(group);
    }
    group.photos.push(photo);
  }
  return groups;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function fileNameFor(photo: GalleryPhoto, blob: Blob) {
  const base =
    (photo.caption || 'galeria')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\w-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'galeria';
  const extension = blob.type.split('/')[1]?.split(';')[0] || (photo.mediaType === 'video' ? 'mp4' : 'jpg');
  return `${base}.${extension}`;
}

async function fetchMediaFile(photo: GalleryPhoto): Promise<File> {
  const response = await fetch(photo.imageData);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  return new File([blob], fileNameFor(photo, blob), { type: blob.type });
}

export async function downloadMedia(photo: GalleryPhoto): Promise<void> {
  const file = await fetchMediaFile(photo);
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const canShareFiles = () => typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';

export async function shareMedia(photo: GalleryPhoto): Promise<boolean> {
  const file = await fetchMediaFile(photo);
  if (!navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: photo.caption || 'Galeria', text: photo.caption || undefined });
  } catch (err) {
    if ((err as DOMException)?.name !== 'AbortError') throw err;
  }
  return true;
}
