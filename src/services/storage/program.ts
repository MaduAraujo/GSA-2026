import { supabase } from '../supabaseClient';
import type { HostedEvent, ProgramDeadline, ReferenceLink, WeeklyScore } from '../../types';
import { requireUserId } from './files';
import {
  hostedEventToRow,
  programDeadlineToRow,
  referenceLinkToRow,
  rowToHostedEvent,
  rowToProgramDeadline,
  rowToReferenceLink,
  rowToWeeklyScore,
  weeklyScoreToRow,
} from './mappers';

export async function getWeeklyScores(): Promise<WeeklyScore[]> {
  const { data, error } = await supabase.from('weekly_scores').select('*').order('week_start', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToWeeklyScore);
}

export async function saveWeeklyScore(weeklyScore: WeeklyScore): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('weekly_scores').upsert(weeklyScoreToRow(weeklyScore, userId));
  if (error) throw error;
}

export async function deleteWeeklyScore(id: string): Promise<void> {
  const { error } = await supabase.from('weekly_scores').delete().eq('id', id);
  if (error) throw error;
}

export async function getReferenceLinks(): Promise<ReferenceLink[]> {
  const { data, error } = await supabase.from('reference_links').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToReferenceLink);
}

export async function saveReferenceLink(referenceLink: ReferenceLink): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('reference_links').upsert(referenceLinkToRow(referenceLink, userId));
  if (error) throw error;
}

export async function deleteReferenceLink(id: string): Promise<void> {
  const { error } = await supabase.from('reference_links').delete().eq('id', id);
  if (error) throw error;
}

export async function getProgramDeadlines(): Promise<ProgramDeadline[]> {
  const { data, error } = await supabase.from('program_deadlines').select('*').order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToProgramDeadline);
}

export async function saveProgramDeadline(deadline: ProgramDeadline): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('program_deadlines').upsert(programDeadlineToRow(deadline, userId));
  if (error) throw error;
}

export async function deleteProgramDeadline(id: string): Promise<void> {
  const { error } = await supabase.from('program_deadlines').delete().eq('id', id);
  if (error) throw error;
}

export async function getHostedEvents(): Promise<HostedEvent[]> {
  const { data, error } = await supabase.from('hosted_events').select('*').order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToHostedEvent);
}

export async function saveHostedEvent(event: HostedEvent): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('hosted_events').upsert(hostedEventToRow(event, userId));
  if (error) throw error;
}

export async function deleteHostedEvent(id: string): Promise<void> {
  const { error } = await supabase.from('hosted_events').delete().eq('id', id);
  if (error) throw error;
}
