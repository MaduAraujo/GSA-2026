import { describe, expect, it } from 'vitest';
import { countLabel } from './plural';

describe('countLabel', () => {
  it('uses the singular form for exactly one item', () => {
    expect(countLabel(1, 'certificado', 'certificados')).toBe('1 certificado');
  });

  it('uses the plural form for more than one item', () => {
    expect(countLabel(3, 'certificado', 'certificados')).toBe('3 certificados');
  });

  it('returns an empty string when there is nothing to count', () => {
    expect(countLabel(0, 'certificado', 'certificados')).toBe('');
  });
});
