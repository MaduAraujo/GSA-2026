import type { AmbassadorSession, SessionType } from '../../types';

export const SESSION_TYPES: { type: SessionType; tab: string; newLabel: string; editLabel: string }[] = [
  { type: 'Conversa', tab: 'Conversas', newLabel: 'Nova Conversa', editLabel: 'Editar Conversa' },
  { type: 'Masterclass', tab: 'Masterclasses', newLabel: 'Nova Masterclass', editLabel: 'Editar Masterclass' },
  { type: 'Sessão', tab: 'Sessões', newLabel: 'Nova Sessão', editLabel: 'Editar Sessão' },
];

export const sessionTypeOf = (session: Partial<AmbassadorSession>): SessionType => session.type ?? 'Sessão';

export const sessionTypeLabels = (session: Partial<AmbassadorSession>) =>
  SESSION_TYPES.find((t) => t.type === sessionTypeOf(session)) ?? SESSION_TYPES[2]!;
