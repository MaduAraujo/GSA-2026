export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  return new Date(value);
}

const isValid = (date: Date) => !Number.isNaN(date.getTime());

export function formatDateBR(value?: string | Date): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const [year, month, day] = value.split('-');
    if (year && month && day && /^\d{2}$/.test(day)) return `${day}/${month}/${year}`;
  }
  const date = toDate(value);
  if (!isValid(date)) return typeof value === 'string' ? value : '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateShortBR(value: string | Date): string {
  const date = toDate(value);
  if (!isValid(date)) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
}

export function formatDateTimeBR(value: string | Date): string {
  const date = toDate(value);
  if (!isValid(date)) return '';
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function formatMonthYearBR(value: string | Date): string {
  const date = toDate(value);
  if (!isValid(date)) return '';
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(isoDate: string, days: number): string {
  const [year = 1970, month = 1, day = 1] = isoDate.split('-').map(Number);
  return toISODate(new Date(year, month - 1, day + days));
}

export function formatRelativePtBR(isoDate: string, now: Date = new Date()): string {
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return '';
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  const years = Math.floor(days / 365);
  return years <= 1 ? 'há 1 ano' : `há ${years} anos`;
}
