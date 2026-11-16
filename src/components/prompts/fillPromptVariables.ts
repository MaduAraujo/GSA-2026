import type { PromptItem } from '../../types';

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PLACEHOLDER = /\[([A-ZÀ-Ý][A-ZÀ-Ý0-9_]*(?: [A-ZÀ-Ý0-9_]+)*)\](?!\()/g;

export function getPromptVariables(prompt: Pick<PromptItem, 'promptText' | 'variables'>): string[] {
  const names = new Map<string, string>();
  for (const v of prompt.variables ?? []) names.set(v.toUpperCase(), v);
  for (const match of prompt.promptText.matchAll(PLACEHOLDER)) {
    const name = match[1]!;
    if (!names.has(name)) names.set(name, name);
  }
  return Array.from(names.values());
}

export function fillPromptVariables(text: string, values: Record<string, string>): string {
  let result = text;
  for (const [key, val] of Object.entries(values)) {
    if (!val.trim()) continue;
    const name = escapeRegExp(key);
    result = result.replace(new RegExp(`\\[${name}\\]|\\[INSERIR ${name}[^\\]]*\\]`, 'gi'), () => val);
  }
  return result;
}
