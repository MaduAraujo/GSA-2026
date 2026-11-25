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
  type EnhancedPrompt,
} from '../shared/aiSchemas';
import { getAuthHeaders } from './supabaseClient';

export type {
  AnalyzeCertParams,
  AnalyzedCertificateResult,
  ChatAttachment,
  ChatHistoryMessage,
  EnhancePromptParams,
  EnhancedPrompt,
};

const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
const TOO_LARGE_MESSAGE =
  'O arquivo é grande demais para a IA analisar (limite de cerca de 3MB). Use um arquivo menor ou preencha os campos manualmente.';

async function postJson<S extends z.ZodType>(
  url: string,
  body: unknown,
  responseSchema: S,
  fallbackError: string,
): Promise<z.infer<S>> {
  const payload = JSON.stringify(body);
  if (new Blob([payload]).size > MAX_REQUEST_BYTES) {
    throw new Error(TOO_LARGE_MESSAGE);
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: payload,
  });

  if (res.status === 413) {
    throw new Error(TOO_LARGE_MESSAGE);
  }
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
  async enhancePrompt(params: EnhancePromptParams): Promise<EnhancedPrompt> {
    const { enhanced, improvements, tip } = await postJson(
      '/api/ai/enhance-prompt',
      params,
      enhancePromptResponseSchema,
      'Falha ao aprimorar prompt.',
    );
    return { enhanced, improvements, tip };
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
