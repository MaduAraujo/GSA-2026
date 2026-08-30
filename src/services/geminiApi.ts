export interface ChatHistoryMessage {
  sender: 'user' | 'gemini';
  text: string;
}

export interface GeneratePostParams {
  topic: string;
  platform: string;
  tone: string;
  category?: string;
  keyPoints?: string;
  callToAction?: string;
  customInstructions?: string;
}

export interface EnhancePromptParams {
  prompt: string;
  section: string;
  objective?: string;
}

export interface AnalyzeCertParams {
  title?: string;
  issuer?: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface AnalyzedCertificateResult {
  suggestedTitle: string;
  issuer: string;
  category: 'Google Cloud' | 'GenAI & Gemini' | 'Liderança' | 'Desenvolvimento' | 'Comunidade' | string;
  skills: string[];
  summary: string;
  linkedinCaption: string;
}

export const GeminiApiService = {
  async generatePost(params: GeneratePostParams): Promise<string> {
    const res = await fetch('/api/gemini/generate-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao gerar post com o Gemini.');
    }

    const data = await res.json();
    return data.post;
  },

  async enhancePrompt(params: EnhancePromptParams): Promise<string> {
    const res = await fetch('/api/gemini/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao aprimorar prompt.');
    }

    const data = await res.json();
    return data.enhanced;
  },

  async analyzeCertificate(params: AnalyzeCertParams): Promise<AnalyzedCertificateResult> {
    const res = await fetch('/api/gemini/analyze-certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao analisar certificado.');
    }

    const data = await res.json();
    return data.data;
  },

  async sendChatMessage(message: string, history?: ChatHistoryMessage[]): Promise<string> {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha no assistente Gemini.');
    }

    const data = await res.json();
    return data.reply;
  },
};
