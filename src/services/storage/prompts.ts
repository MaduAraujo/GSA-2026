import { supabase } from '../supabaseClient';
import type { PromptDoc, PromptItem } from '../../types';
import { getBatchSignedUrls, PROMPT_DOCS_BUCKET, requireUserId } from './files';
import { promptDocToRow, promptToRow, rowToPrompt, rowToPromptDoc } from './mappers';

export async function getPrompts(): Promise<PromptItem[]> {
  const { data, error } = await supabase.from('prompts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToPrompt);
}

export async function savePrompt(prompt: PromptItem): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('prompts').upsert(promptToRow(prompt, userId));
  if (error) throw error;
}

export async function deletePrompt(id: string): Promise<void> {
  const { error } = await supabase.from('prompts').delete().eq('id', id);
  if (error) throw error;
}

export async function getPromptDocs(): Promise<PromptDoc[]> {
  const { data, error } = await supabase.from('prompt_docs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const signedUrls = await getBatchSignedUrls(
    PROMPT_DOCS_BUCKET,
    rows.map((r) => r.file_path),
  );
  return rows.map((row) => rowToPromptDoc(row, signedUrls));
}

export async function uploadPromptDocFile(file: File, docId: string): Promise<string> {
  const userId = await requireUserId();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${userId}/${docId}-${safeName}`;
  const { error } = await supabase.storage.from(PROMPT_DOCS_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

export async function deletePromptDocFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(PROMPT_DOCS_BUCKET).remove([filePath]);
  if (error) throw error;
}

export async function savePromptDoc(doc: PromptDoc): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('prompt_docs').upsert(promptDocToRow(doc, userId));
  if (error) throw error;
}

export async function deletePromptDoc(id: string): Promise<void> {
  const { error } = await supabase.from('prompt_docs').delete().eq('id', id);
  if (error) throw error;
}
