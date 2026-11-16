import { describe, expect, it } from 'vitest';
import { formatRelativePtBR } from './date';

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
