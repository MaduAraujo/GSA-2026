import type { PromptItem } from '../../types';
import { getPromptVariables } from './fillPromptVariables';

export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesPromptSearch(prompt: PromptItem, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  return [prompt.title, prompt.promptText, prompt.section, ...prompt.tags, ...getPromptVariables(prompt)].some(
    (field) => normalizeSearch(field ?? '').includes(q),
  );
}

export type PromptSortOption = 'recent' | 'most-used' | 'last-used' | 'title';

export const PROMPT_SORT_LABELS: Record<PromptSortOption, string> = {
  recent: 'Mais recentes',
  'most-used': 'Mais usados',
  'last-used': 'Usados recentemente',
  title: 'Título (A-Z)',
};

export const PROMPT_SORTERS: Record<PromptSortOption, (a: PromptItem, b: PromptItem) => number> = {
  recent: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  'most-used': (a, b) => (b.usageCount || 0) - (a.usageCount || 0),
  'last-used': (a, b) => (b.lastUsed ?? '').localeCompare(a.lastUsed ?? ''),
  title: (a, b) => a.title.localeCompare(b.title, 'pt-BR'),
};
