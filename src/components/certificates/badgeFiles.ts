import { formatDateShortBR } from '../../utils/date';

export const isBadgeImage = (fileName: string) => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(fileName);

export function badgeDisplayName(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : fileName;
}

export function formatBadgeAddedAt(iso: string): string {
  return formatDateShortBR(iso);
}
