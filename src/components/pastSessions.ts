export interface PastSessionPerson {
  role: 'Team Leader' | 'Team Leaders' | 'Creator' | 'Googler';
  names: string;
}

export interface PastSession {
  id: string;
  title: string;
  series?: string;
  date: string;
  people: PastSessionPerson[];
}

export const PAST_SESSIONS: PastSession[] = [
  {
    id: 'gemini-01-study-notebooks',
    title: 'Study Notebooks',
    series: 'Sessão 01 de Google Gemini',
    date: '28/08',
    people: [{ role: 'Team Leaders', names: 'Júlia Pavão G6, Estêvão Zilioli (Time Amplifica)' }],
  },
  {
    id: 'gemini-02-canvas-base-de-dados',
    title: 'Canvas com base de dados',
    series: 'Sessão 02 de Google Gemini',
    date: '04/09',
    people: [{ role: 'Team Leaders', names: 'Iolanda França G5, Edu Sousa (Time Amplifica)' }],
  },
  {
    id: 'gemini-03-estudos-gemini-canvas',
    title: 'Estudos com Gemini Canvas',
    series: 'Sessão 03 de Google Gemini',
    date: '28/08',
    people: [{ role: 'Team Leader', names: 'Carla Arena (Time Amplifica)' }],
  },
  {
    id: 'masterclass-creator-01',
    title: 'Google Gemini para criação de conteúdo',
    series: 'Masterclass com Creator #1',
    date: '16/09',
    people: [
      { role: 'Creator', names: 'Otávio Pompeu' },
      { role: 'Team Leader', names: 'Iolanda França' },
    ],
  },
  {
    id: 'conversa-googler-01',
    title: 'Bernardo Barlach',
    series: 'Conversa com Googler #01',
    date: '28/08',
    people: [
      {
        role: 'Googler',
        names:
          'Bernardo Barlach, Gerente de Programa de Acessibilidade e Relacionamento Externo para a América Latina no Google',
      },
      { role: 'Team Leader', names: 'Carla Arena (Time Amplifica)' },
    ],
  },
  {
    id: 'gemini-04-gemini-live',
    title: 'Gemini Live',
    series: 'Sessão 04 de Google Gemini',
    date: '01/10',
    people: [{ role: 'Team Leaders', names: 'Eduarda Py G1, Estêvão Zilioli (Time Amplifica)' }],
  },
  {
    id: 'cafe-com-team-leaders',
    title: 'Café com Team Leaders',
    date: '08/10',
    people: [
      {
        role: 'Team Leaders',
        names:
          'Eduarda Py G1, Edu Isaias G2, Beth Fantauzzi G3, Fabi Gontijo G4, Iolanda França G5, Júlia Pavão G6, Kadu Braga G7, Sávio Ferraz G8, Carla Arena (Time Amplifica), Eduardo Aquino (Time Amplifica)',
      },
    ],
  },
  {
    id: 'gemini-05-apps-conectados',
    title: 'Apps conectados',
    series: 'Sessão 05 de Google Gemini',
    date: '13/10',
    people: [{ role: 'Team Leaders', names: 'Fabi Gontijo G4, Estêvão Zilioli (Time Amplifica)' }],
  },
  {
    id: 'masterclass-creator-02',
    title: 'Leo Candido',
    series: 'Masterclass com Creator #2',
    date: '16/10',
    people: [
      { role: 'Creator', names: 'Leo Candido' },
      { role: 'Team Leader', names: 'Iolanda França' },
    ],
  },
  {
    id: 'unboxing-oficial-dicas-facilitacao',
    title: 'Dicas de facilitação',
    series: 'Unboxing Oficial',
    date: '20/10',
    people: [{ role: 'Team Leaders', names: 'Dani Veronezi (Time Amplifica), Eduardo Aquino (Time Amplifica)' }],
  },
];
