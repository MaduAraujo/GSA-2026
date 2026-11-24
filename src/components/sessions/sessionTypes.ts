import type { AmbassadorSession, SessionType } from '../../types';

export interface SessionTypeLabels {
  type: SessionType;
  tab: string;
  newLabel: string;
  editLabel: string;
  noun: string;
  plural: string;
}

export const SESSION_TYPES: SessionTypeLabels[] = [
  {
    type: 'Conversa',
    tab: 'Conversas',
    newLabel: 'Nova Conversa',
    editLabel: 'Editar Conversa',
    noun: 'conversa',
    plural: 'conversas',
  },
  {
    type: 'Masterclass',
    tab: 'Masterclasses',
    newLabel: 'Nova Masterclass',
    editLabel: 'Editar Masterclass',
    noun: 'masterclass',
    plural: 'masterclasses',
  },
  {
    type: 'Sessão',
    tab: 'Sessões',
    newLabel: 'Nova Sessão',
    editLabel: 'Editar Sessão',
    noun: 'sessão',
    plural: 'sessões',
  },
];

export const sessionTypeOf = (session: Partial<AmbassadorSession>): SessionType => session.type ?? 'Sessão';

export const sessionTypeLabels = (session: Partial<AmbassadorSession>) =>
  SESSION_TYPES.find((t) => t.type === sessionTypeOf(session)) ?? SESSION_TYPES[2]!;
