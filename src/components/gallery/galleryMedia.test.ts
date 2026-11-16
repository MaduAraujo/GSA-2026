import { describe, expect, it } from 'vitest';
import type { GalleryPhoto } from '../../types';
import { formatDuration, groupByMonth, readExifDate, validateMediaFile } from './galleryMedia';

function jpegWithExifDate(date: string, littleEndian = true): ArrayBuffer {
  const tiff = new ArrayBuffer(64);
  const view = new DataView(tiff);
  view.setUint16(0, littleEndian ? 0x4949 : 0x4d4d);
  view.setUint16(2, 42, littleEndian);
  view.setUint32(4, 8, littleEndian);
  view.setUint16(8, 1, littleEndian);
  view.setUint16(10, 0x8769, littleEndian);
  view.setUint16(12, 4, littleEndian);
  view.setUint32(14, 1, littleEndian);
  view.setUint32(18, 26, littleEndian);
  view.setUint16(26, 1, littleEndian);
  view.setUint16(28, 0x9003, littleEndian);
  view.setUint16(30, 2, littleEndian);
  view.setUint32(32, 20, littleEndian);
  view.setUint32(36, 44, littleEndian);
  for (let i = 0; i < date.length; i++) view.setUint8(44 + i, date.charCodeAt(i));

  const header = [0xff, 0xd8, 0xff, 0xe1, 0x00, 64 + 8, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
  const out = new Uint8Array(header.length + tiff.byteLength);
  out.set(header);
  out.set(new Uint8Array(tiff), header.length);
  return out.buffer;
}

const photo = (id: string, takenAt?: string, createdAt = '2026-01-01T00:00:00.000Z'): GalleryPhoto => ({
  id,
  imageData: '',
  caption: '',
  category: '',
  takenAt,
  createdAt,
});

describe('readExifDate', () => {
  it('reads DateTimeOriginal from little- and big-endian EXIF', () => {
    expect(readExifDate(jpegWithExifDate('2026:10:05 14:30:00'))).toBe('2026-10-05');
    expect(readExifDate(jpegWithExifDate('2025:02:28 09:00:00', false))).toBe('2025-02-28');
  });

  it('returns undefined for non-JPEG data or empty dates', () => {
    expect(readExifDate(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toBeUndefined();
    expect(readExifDate(jpegWithExifDate('0000:00:00 00:00:00'))).toBeUndefined();
  });
});

describe('groupByMonth', () => {
  it('groups consecutive items by month of capture, falling back to the creation date', () => {
    const groups = groupByMonth([
      photo('a', '2026-10-20'),
      photo('b', '2026-10-01'),
      photo('c', undefined, '2026-09-15T10:00:00.000Z'),
    ]);
    expect(groups.map((g) => [g.label, g.photos.map((p) => p.id)])).toEqual([
      ['Outubro de 2026', ['a', 'b']],
      ['Setembro de 2026', ['c']],
    ]);
  });
});

describe('formatDuration', () => {
  it('formats seconds as m:ss', () => {
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(125.4)).toBe('2:05');
    expect(formatDuration(Number.NaN)).toBe('');
  });
});

describe('validateMediaFile', () => {
  it('accepts images and videos within the limits', () => {
    expect(validateMediaFile(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).toBeNull();
    expect(validateMediaFile(new File(['x'], 'a.mp4', { type: 'video/mp4' }))).toBeNull();
  });

  it('rejects other file types', () => {
    expect(validateMediaFile(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toMatch('não é uma imagem');
  });
});
