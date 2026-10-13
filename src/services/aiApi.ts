import type { z } from 'zod';
import {
  analyzeCertificateResponseSchema,
  chatResponseSchema,
  enhancePromptResponseSchema,
  type AnalyzeCertParams,
  type AnalyzedCertificateResult,
  type ChatAttachment,
  type ChatHistoryMessage,
  type EnhancePromptParams,
} from '../shared/aiSchemas';
import { getAuthHeaders } from './supabaseClient';

export type { AnalyzeCertParams, AnalyzedCertificateResult, ChatAttachment, ChatHistoryMessage, EnhancePromptParams };

async function postJson<S extends z.ZodType>(
  url: string,
  body: unknown,
  responseSchema: S,
  fallbackError: string,
): Promise<z.infer<S>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: unknown };
    throw new Error(typeof err.error === 'string' && err.error ? err.error : fallbackError);
  }

  const parsed = responseSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new Error('Resposta inesperada do servidor.');
  }
  return parsed.data;
}

export const AiApiService = {
  async enhancePrompt(params: EnhancePromptParams): Promise<string> {
    const data = await postJson(
      '/api/ai/enhance-prompt',
      params,
      enhancePromptResponseSchema,
      'Falha ao aprimorar prompt.',
    );
    return data.enhanced;
  },

  async analyzeCertificate(params: AnalyzeCertParams): Promise<AnalyzedCertificateResult> {
    const data = await postJson(
      '/api/ai/analyze-certificate',
      params,
      analyzeCertificateResponseSchema,
      'Falha ao analisar certificado.',
    );
    return data.data;
  },

  async sendChatMessage(message: string, history?: ChatHistoryMessage[], attachment?: ChatAttachment): Promise<string> {
    const data = await postJson(
      '/api/ai/chat',
      { message, history, attachment },
      chatResponseSchema,
      'Falha no assistente de IA.',
    );
    return data.reply;
  },
};
