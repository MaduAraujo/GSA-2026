import type { EventDuration, HostedEvent } from '../../types';

export const OFFICIAL_HASHTAG = '#EmbaixadoresEstudantisGoogle';
export const GEMINI_TEST_URL = 'http://goo.gle/teste-Gemini';
export const MEDIA_KIT_URL = 'https://sites.google.com/amplifica.me/embaixadoresestudantis/mediakit';
export const BRAND_MANUAL_URL =
  'https://docs.google.com/presentation/d/e/2PACX-1vTX5jNk96XcLC3DI7ZmkoZ_EzlWQXdu8KcxkYzOOf1P_CwrNwMyAdfgJi8jMEyDkuR9VMbnDJOPTlln/pub?start=false&loop=false&delayms=3000&slide=id.g3f9ea5ee024_0_0';

export const MIN_PARTICIPANTS = 5;
export const EVENT_DURATIONS: EventDuration[] = [30, 45, 60];
export const EVENT_FORMATS = ['Grupo de estudos', 'Workshop', 'Demonstração ao vivo', 'Roda de conversa'];

export interface TemplateLink {
  label: string;
  url: string;
}

export const TEMPLATES: TemplateLink[] = [
  {
    label: 'Modelo Grupo de Estudos Prompts | PARTS',
    url: 'https://docs.google.com/presentation/d/1ZbxcnQuX8-BvealHUUHrZFelAoRhxumH6OU0dT_lelE/copy',
  },
  {
    label: 'Modelo Sessão Gemini Canvas',
    url: 'https://docs.google.com/presentation/d/1-RGLu9yIZbh8bKe5_kwoxfuusnbI2al4akjMqkSm-Zw/copy',
  },
  {
    label: 'Modelo de Panfleto',
    url: 'https://docs.google.com/presentation/d/12bbD7YuQKrk9m_avYh-z1gPQr6ZJ93ykTbqwdknEy4M/copy',
  },
];

export interface GuideStep {
  title: string;
  description: string;
}

export const EVENT_STEPS: GuideStep[] = [
  {
    title: 'Tema',
    description:
      'Escolha um assunto de IA útil para o seu público, como Engenharia de Prompts ou Gemini Canvas. Um tema por encontro deixa a sessão objetiva.',
  },
  {
    title: 'Formato',
    description:
      'Sessão presencial de 30 a 60 minutos: grupo de estudos, workshop, demonstração ao vivo ou roda de conversa.',
  },
  {
    title: 'Planejamento',
    description:
      'Defina data, horário e local no campus. Use os modelos de apresentação oficiais para montar o roteiro da sessão.',
  },
  {
    title: 'Link do App',
    description: `Leve o link oficial de teste (${GEMINI_TEST_URL}) em QR Code para que os participantes experimentem o Gemini durante o encontro.`,
  },
  {
    title: 'Divulgação',
    description: `Crie a arte com o Media Kit ou o Modelo de Panfleto e publique nas redes com a hashtag ${OFFICIAL_HASHTAG}.`,
  },
  {
    title: 'Registro',
    description:
      'Registre foto ou vídeo da sessão acontecendo e envie no formulário semanal (check-out) para validar a pontuação.',
  },
];

export const VALIDATION_RULES: string[] = [
  'O evento precisa ser estritamente presencial.',
  `Mínimo de ${MIN_PARTICIPANTS} participantes, além de você.`,
  'A foto ou o vídeo de comprovação deve mostrar a apresentação acontecendo.',
  'A foto ou o vídeo não pode ter filtros nem ser gerado ou editado por IA.',
];

export const COMPLIANCE_RULES: string[] = [
  'Você não fala em nome do Google: apresente-se como embaixador(a) estudantil do programa.',
  'Use a marca Google e a identidade visual apenas conforme o Manual da Marca e o Media Kit oficiais, sem alterar logos, cores ou proporções.',
  'Não crie materiais que sugiram vínculo empregatício com Google ou Amplifica.',
  'Não use a marca fora do contexto do programa ou em ações pagas.',
];

export type ChecklistAction =
  { kind: 'link'; label: string; url: string } | { kind: 'copy'; label: string; value: string };

export interface ChecklistItem {
  id: string;
  label: string;
  actions?: ChecklistAction[];
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'duration', label: 'Definir duração (30, 45 ou 60 min) e formato' },
  {
    id: 'slides',
    label: 'Baixar o modelo de apresentação do portal',
    actions: TEMPLATES.slice(0, 2).map((t) => ({ kind: 'link' as const, label: t.label, url: t.url })),
  },
  {
    id: 'art',
    label: 'Criar a arte de divulgação com o Media Kit',
    actions: [
      { kind: 'link', label: 'Media Kit', url: MEDIA_KIT_URL },
      { kind: 'link', label: 'Manual da Marca', url: BRAND_MANUAL_URL },
      { kind: 'link', label: TEMPLATES[2]!.label, url: TEMPLATES[2]!.url },
    ],
  },
  {
    id: 'post',
    label: 'Postar nas redes sociais com a hashtag oficial',
    actions: [{ kind: 'copy', label: 'Copiar hashtag', value: OFFICIAL_HASHTAG }],
  },
  {
    id: 'qrcode',
    label: 'Imprimir/preparar o QR Code com o link oficial para testes',
    actions: [{ kind: 'copy', label: 'Copiar link de teste', value: GEMINI_TEST_URL }],
  },
];

export interface ValidationQuestion {
  id: string;
  label: string;
}

export const VALIDATION_QUESTIONS: ValidationQuestion[] = [
  { id: 'in_person', label: 'O evento foi presencial?' },
  { id: 'shows_presentation', label: 'A foto/vídeo mostra a apresentação?' },
  { id: 'raw_media', label: 'A foto/vídeo está crua (sem filtros de Instagram/TikTok ou IA)?' },
];

export type EventStatus = 'planning' | 'ready' | 'awaitingValidation' | 'validated';

export function checklistProgress(event: HostedEvent) {
  const done = CHECKLIST_ITEMS.filter((item) => event.checklistDone.includes(item.id)).length;
  return { done, total: CHECKLIST_ITEMS.length };
}

export function hasEnoughParticipants(event: HostedEvent) {
  return (event.participants ?? 0) >= MIN_PARTICIPANTS;
}

export function isValidated(event: HostedEvent) {
  return (
    hasEnoughParticipants(event) && VALIDATION_QUESTIONS.every((question) => event.validationDone.includes(question.id))
  );
}

export function eventStatus(event: HostedEvent, today: string): EventStatus {
  if (isValidated(event)) return 'validated';
  if (event.date <= today) return 'awaitingValidation';
  const { done, total } = checklistProgress(event);
  return done === total ? 'ready' : 'planning';
}

export const STATUS_LABELS: Record<EventStatus, { label: string; className: string }> = {
  planning: { label: 'Planejando', className: 'bg-gray-100 text-gray-600' },
  ready: { label: 'Pronto', className: 'bg-[#1A73E8]/10 text-[#1A73E8]' },
  awaitingValidation: { label: 'Validar evidências', className: 'bg-[#FBBC04]/15 text-[#9E5D00]' },
  validated: { label: 'Pronto p/ check-out', className: 'bg-[#34A853]/10 text-[#1E8E3E]' },
};
