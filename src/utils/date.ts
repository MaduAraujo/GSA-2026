export function formatDateBR(isoDate?: string): string {
  const [year, month, day] = (isoDate || '').split('-');
  if (!year || !month || !day) return isoDate || '';
  return `${day}/${month}/${year}`;
}

export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addDaysISO(isoDate: string, days: number): string {
  const [year = 1970, month = 1, day = 1] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}
