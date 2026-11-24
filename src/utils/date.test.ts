import { describe, expect, it } from 'vitest';
import {
  formatDateBR,
  formatDateShortBR,
  formatDateTimeBR,
  formatMonthYearBR,
  formatRelativePtBR,
  toISODate,
} from './date';

describe('formatRelativePtBR', () => {
  const now = new Date(2026, 10, 16, 15, 0);

  it.each([
    [new Date(2026, 10, 16, 8, 0), 'hoje'],
    [new Date(2026, 10, 15, 23, 0), 'ontem'],
    [new Date(2026, 10, 13, 12, 0), 'há 3 dias'],
    [new Date(2026, 9, 10, 12, 0), 'há 1 mês'],
    [new Date(2026, 4, 1, 12, 0), 'há 6 meses'],
    [new Date(2024, 4, 1, 12, 0), 'há 2 anos'],
  ])('formats %s as "%s"', (date, expected) => {
    expect(formatRelativePtBR(date.toISOString(), now)).toBe(expected);
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatRelativePtBR('not-a-date', now)).toBe('');
  });
});

describe('shared date formats', () => {
  it('formatDateBR handles plain dates, timestamps and Date objects', () => {
    expect(formatDateBR('2026-11-24')).toBe('24/11/2026');
    expect(formatDateBR(new Date(2026, 10, 24, 15))).toBe('24/11/2026');
    expect(formatDateBR(new Date(2026, 10, 24, 15).toISOString())).toBe('24/11/2026');
    expect(formatDateBR('sem data')).toBe('sem data');
    expect(formatDateBR(undefined)).toBe('');
  });

  it('formatDateShortBR, formatDateTimeBR and formatMonthYearBR', () => {
    expect(formatDateShortBR('2026-11-24')).toBe('24 de nov de 2026');
    expect(formatDateTimeBR(new Date(2026, 10, 24, 14, 30))).toBe('24/11, 14:30');
    expect(formatMonthYearBR('2026-11-01')).toBe('Novembro de 2026');
    expect(formatMonthYearBR('inválida')).toBe('');
  });

  it('toISODate uses the local calendar day', () => {
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
