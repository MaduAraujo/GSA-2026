export interface DurationLike {
  hours?: number;
  minutes?: number;
}

export function certHoursDecimal(cert: DurationLike): number {
  return (cert.hours || 0) + (cert.minutes || 0) / 60;
}

export function sumCertHours(certificates: DurationLike[]): number {
  return certificates.reduce((acc, c) => acc + certHoursDecimal(c), 0);
}

export function formatDuration(hours?: number, minutes?: number): string {
  const h = hours || 0;
  const m = minutes || 0;
  if (h && m) return `${h}h ${m}`;
  if (h) return `${h}h`;
  if (m) return `${m}min`;
  return '0h';
}

export function formatTotalHoursDecimal(totalHoursDecimal: number): string {
  const totalMinutes = Math.round(totalHoursDecimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return formatDuration(h, m);
}