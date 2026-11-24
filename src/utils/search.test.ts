import { describe, expect, it } from 'vitest';
import { normalizeSearch } from './search';

describe('normalizeSearch', () => {
  it('lowercases and strips accents so searches ignore them', () => {
    expect(normalizeSearch('Sessões de Ação')).toBe('sessoes de acao');
  });
});
