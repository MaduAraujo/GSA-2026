import { describe, expect, it } from 'vitest';
import { fillPromptVariables, getPromptVariables } from './fillPromptVariables';

describe('getPromptVariables', () => {
  it('adds all-caps placeholders found in the text to the declared variables, without duplicates', () => {
    expect(
      getPromptVariables({ promptText: 'Explique [TEMA] para [PUBLICO ALVO] e [TEMA].', variables: ['TEMA', 'TOM'] }),
    ).toEqual(['TEMA', 'TOM', 'PUBLICO ALVO']);
  });

  it('ignores Markdown links, checkboxes and lowercase brackets', () => {
    expect(
      getPromptVariables({ promptText: 'Veja [Docs](https://x.com), - [x] feito, - [ ] pendente, [nota]' }),
    ).toEqual([]);
  });
});

describe('fillPromptVariables', () => {
  it('replaces [VAR] and [INSERIR VAR ...] placeholders case-insensitively', () => {
    expect(fillPromptVariables('Fale de [tema] e [INSERIR TEMA aqui].', { TEMA: 'IA' })).toBe('Fale de IA e IA.');
  });

  it('leaves placeholders with blank values untouched', () => {
    expect(fillPromptVariables('Fale de [TEMA].', { TEMA: '  ' })).toBe('Fale de [TEMA].');
  });

  it('treats regex characters in names and $ in values literally', () => {
    expect(fillPromptVariables('Custo: [PREÇO (R$)]', { 'PREÇO (R$)': '$& 10' })).toBe('Custo: $& 10');
  });
});
