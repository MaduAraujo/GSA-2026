import { z } from 'zod';

const MAX_PROMPT_CHARS = 20_000;
const MAX_HISTORY_MESSAGES = 50;

export const attachmentSchema = z.object({
  dataUrl: z.string().startsWith('data:', 'Anexo inválido.'),
  mimeType: z.string(),
  fileName: z.string().optional(),
});

export const enhancePromptRequestSchema = z.object({
  prompt: z
    .string({ error: 'O prompt original é obrigatório.' })
    .trim()
    .min(1, 'O prompt original é obrigatório.')
    .max(MAX_PROMPT_CHARS, 'O prompt é longo demais.'),
  section: z.string().default('Estudos'),
  objective: z.string().default('Melhorar clareza e resultados'),
});

export const analyzeCertificateRequestSchema = z.object({
  title: z.string().optional(),
  issuer: z.string().optional(),
  imageBase64: z
    .string({ error: 'Envie o arquivo do certificado antes de usar o preenchimento automático.' })
    .min(1, 'Envie o arquivo do certificado antes de usar o preenchimento automático.'),
  mimeType: z.string().optional(),
});

export const chatHistoryMessageSchema = z.object({
  sender: z.enum(['user', 'assistant']),
  text: z.string(),
});

export const chatRequestSchema = z.object({
  message: z
    .string({ error: 'A mensagem é obrigatória.' })
    .trim()
    .min(1, 'A mensagem é obrigatória.')
    .max(MAX_PROMPT_CHARS, 'A mensagem é longa demais.'),
  history: z.array(chatHistoryMessageSchema).max(MAX_HISTORY_MESSAGES).default([]),
  attachment: attachmentSchema.optional(),
});

export const analyzedCertificateSchema = z.object({
  suggestedTitle: z.string().default(''),
  issuer: z.string().default(''),
  category: z.string().default(''),
  skills: z.array(z.string()).default([]),
  summary: z.string().default(''),
  linkedinCaption: z.string().default(''),
});

export const enhancePromptResponseSchema = z.object({ enhanced: z.string() });
export const analyzeCertificateResponseSchema = z.object({ data: analyzedCertificateSchema });
export const chatResponseSchema = z.object({ reply: z.string() });

export const pushTestRequestSchema = z.object({
  subscription: z.object(
    {
      endpoint: z.url('Assinatura de push inválida.'),
      keys: z.object({ p256dh: z.string(), auth: z.string() }).optional(),
    },
    { error: 'Assinatura de push inválida.' },
  ),
});

export type ChatAttachment = z.infer<typeof attachmentSchema>;
export type ChatHistoryMessage = z.infer<typeof chatHistoryMessageSchema>;
export type EnhancePromptParams = z.input<typeof enhancePromptRequestSchema>;
export type AnalyzeCertParams = z.input<typeof analyzeCertificateRequestSchema>;
export type AnalyzedCertificateResult = z.infer<typeof analyzedCertificateSchema>;
