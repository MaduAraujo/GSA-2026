import { describe, it, expect } from 'vitest';
import { certHoursDecimal, sumCertHours, formatDuration, formatTotalHoursDecimal } from './duration';

describe('certHoursDecimal', () => {
  it('combines hours and minutes into a decimal', () => {
    expect(certHoursDecimal({ hours: 2, minutes: 30 })).toBe(2.5);
  });

  it('treats missing hours/minutes as zero', () => {
    expect(certHoursDecimal({})).toBe(0);
    expect(certHoursDecimal({ hours: 3 })).toBe(3);
  });
});

describe('sumCertHours', () => {
  it('sums the decimal hours of every certificate', () => {
    expect(sumCertHours([{ hours: 1, minutes: 30 }, { hours: 2 }])).toBe(3.5);
  });

  it('returns 0 for an empty list', () => {
    expect(sumCertHours([])).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats hours and minutes together', () => {
    expect(formatDuration(2, 30)).toBe('2h 30');
  });

  it('formats hours only', () => {
    expect(formatDuration(4, 0)).toBe('4h');
  });

  it('formats minutes only', () => {
    expect(formatDuration(0, 45)).toBe('45min');
  });

  it('falls back to 0h when both are empty', () => {
    expect(formatDuration()).toBe('0h');
  });
});

describe('formatTotalHoursDecimal', () => {
  it('converts a decimal hour total back into hours + minutes', () => {
    expect(formatTotalHoursDecimal(2.5)).toBe('2h 30');
  });

  it('rounds to the nearest minute', () => {
    expect(formatTotalHoursDecimal(1.001)).toBe('1h');
  });
});
