const PROGRAM_YEAR = 2026;
const AGENDA_BASE_URL = 'https://sites.google.com/amplifica.me/embaixadoresestudantis/agenda';

export const AGENDA_ONBOARDING_URL = `${AGENDA_BASE_URL}/onboarding`;

export const AGENDA_WEEKS: Array<{ week: number; start: string; end: string; url?: string }> = [
  { week: 1, url: `${AGENDA_BASE_URL}/semana1`, start: '24/08', end: '30/08' },
  { week: 2, url: `${AGENDA_BASE_URL}/semana2`, start: '31/08', end: '06/09' },
  { week: 3, url: `${AGENDA_BASE_URL}/semana3`, start: '07/09', end: '13/09' },
  { week: 4, url: `${AGENDA_BASE_URL}/semana4`, start: '14/09', end: '20/09' },
  { week: 5, url: `${AGENDA_BASE_URL}/semana5`, start: '21/09', end: '27/09' },
  { week: 6, url: `${AGENDA_BASE_URL}/semana6`, start: '28/09', end: '04/10' },
  { week: 7, url: `${AGENDA_BASE_URL}/semana7`, start: '05/10', end: '11/10' },
  { week: 8, url: `${AGENDA_BASE_URL}/semana8`, start: '12/10', end: '18/10' },
  { week: 9, url: `${AGENDA_BASE_URL}/semana9`, start: '19/10', end: '25/10' },
  { week: 10, url: `${AGENDA_BASE_URL}/semana10`, start: '26/10', end: '01/11' },
  { week: 11, start: '02/11', end: '08/11' },
  { week: 12, start: '09/11', end: '15/11' },
];

const toDate = (dayMonth: string, endOfDay = false) => {
  const [day = 1, month = 1] = dayMonth.split('/').map(Number);
  return endOfDay ? new Date(PROGRAM_YEAR, month - 1, day, 23, 59, 59, 999) : new Date(PROGRAM_YEAR, month - 1, day);
};

export function currentAgendaWeek(now: Date = new Date()): number | null {
  const match = AGENDA_WEEKS.find(({ start, end }) => now >= toDate(start) && now <= toDate(end, true));
  return match?.week ?? null;
}
