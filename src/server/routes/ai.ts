import { Router } from 'express';
import Groq from 'groq-sdk';
import {
  analyzeCertificateRequestSchema,
  analyzedCertificateSchema,
  chatRequestSchema,
  enhancePromptRequestSchema,
} from '../../shared/aiSchemas';
import { extractDocumentText, mimeTypeOfDataUrl } from '../documents';
import { HttpError, parseBody, rateLimit, requireAuth } from '../http';

const GROQ_TEXT_MODEL = 'openai/gpt-oss-120b';
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, 'A chave GROQ_API_KEY não foi configurada nas variáveis de ambiente.');
  }
  groqClient ??= new Groq({ apiKey });
  return groqClient;
}

const ENHANCE_SYSTEM_PROMPT = `Você é um engenheiro de prompts sênior especializado no ecossistema Google Gemini e Google AI Studio.
Sua missão é aprimorar prompts de estudantes e embaixadores do Google, transformando ideias simples em prompts estruturados de nível profissional com Persona, Contexto, Tarefa Clara, Restrições, Formato de Saída e Exemplos quando pertinentes.
Responda em Português do Brasil (pt-BR).`;

const CERTIFICATE_SYSTEM_PROMPT = `Você é um assistente de reconhecimento de conquistas para a Embaixadora Estudantil do Google 2026.
Você analisa o CONTEÚDO REAL de certificados e badges (imagens ou documentos) de cursos, workshops e eventos de tecnologia.
Extraia apenas informações que estejam de fato escritas no certificado anexado — nunca invente título, emissor ou habilidades que não constem no documento.
Você também deve sugerir tags, um resumo fiel do aprendizado e um rascunho de postagem celebratória para o LinkedIn com base no que foi extraído.
Responda sempre em JSON válido, e apenas em JSON, com a seguinte estrutura:
{
  "suggestedTitle": "string",
  "issuer": "string",
  "category": "Google Cloud" | "GenAI & Gemini" | "Liderança" | "Desenvolvimento" | "Comunidade",
  "skills": ["string", "string"],
  "summary": "string",
  "linkedinCaption": "string"
}`;

const CHAT_SYSTEM_PROMPT = `Você é a "Gemini Ambassador Copilot", a assistente de IA oficial da Embaixadora Estudantil do Google 2026.
Você auxilia com:
- Ideias para workshops e palestras de Gemini e Google Cloud na universidade
- Criação de planos de estudo e maratonas de certificações Google
- Ideias de posts e conteúdos para redes sociais
- Estratégias de engajamento estudantil e eventos tech inclusivos
- Dicas de prompt engineering e uso avançado do Gemini.
Seu estilo é acolhedor, altamente inteligente, prático, motivador e focado no sucesso da embaixadora. Utilize formatação Markdown limpa.`;

export const aiRouter = Router();

aiRouter.use(requireAuth, rateLimit);

aiRouter.post('/enhance-prompt', async (req, res) => {
  const { prompt, section, objective } = parseBody(req, enhancePromptRequestSchema);
  const groq = getGroqClient();

  const promptText = `Aprimore este prompt voltado para a seção **${section}**:
Objetivo: ${objective}
Prompt original: "${prompt}"

Por favor, forneça:
1. **Prompt Aprimorado** (pronto para usar no Gemini, bem estruturado)
2. **Explicação das Melhorias** (o que foi adicionado e por que)
3. **Variáveis recomendadas** (ex: [TEMA], [NÍVEL], [DURAÇÃO])
4. **Dica Pro de uso com Gemini 3.7 / Gemini Flash**`;

  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    temperature: 0.4,
    messages: [
      { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
      { role: 'user', content: promptText },
    ],
  });

  res.json({ success: true, enhanced: completion.choices[0]?.message?.content || '' });
});

aiRouter.post('/analyze-certificate', async (req, res) => {
  const { title, issuer, imageBase64 } = parseBody(req, analyzeCertificateRequestSchema);
  const groq = getGroqClient();

  const referenceHints = [
    title
      ? `Título digitado pelo usuário até agora (use apenas como referência secundária, priorize o que está escrito no certificado): ${title}`
      : null,
    issuer
      ? `Emissor digitado pelo usuário até agora (use apenas como referência secundária, priorize o que está escrito no certificado): ${issuer}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const instructionText = `Analise atentamente o certificado anexado e extraia título exato, instituição emissora, categoria, habilidades trabalhadas e um resumo fiel do conteúdo.
${referenceHints}
Responda apenas com o JSON no formato especificado, sem texto adicional.`;

  const mimeType = mimeTypeOfDataUrl(imageBase64);
  let rawContent: string;

  if (mimeType.startsWith('image/')) {
    const completion = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      messages: [
        { role: 'system', content: CERTIFICATE_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: instructionText },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ],
        },
      ],
    });
    rawContent = completion.choices[0]?.message?.content || '';
  } else {
    const extractedText = await extractDocumentText(imageBase64, mimeType);
    if (!extractedText) {
      throw new HttpError(
        400,
        'Não foi possível ler o conteúdo do arquivo. Tente uma imagem (PNG/JPG) ou verifique se o PDF contém texto selecionável.',
      );
    }

    const completion = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: CERTIFICATE_SYSTEM_PROMPT },
        { role: 'user', content: `${instructionText}\n\n--- Conteúdo extraído do certificado ---\n${extractedText}` },
      ],
    });
    rawContent = completion.choices[0]?.message?.content || '';
  }

  let parsed: unknown;
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
  } catch {
    parsed = null;
  }
  const result = analyzedCertificateSchema.safeParse(parsed);
  if (!result.success) {
    throw new HttpError(
      502,
      'Não foi possível interpretar a resposta da IA para este certificado. Tente novamente ou preencha manualmente.',
    );
  }

  res.json({ success: true, data: result.data });
});

aiRouter.post('/chat', async (req, res) => {
  const { message, history, attachment } = parseBody(req, chatRequestSchema);
  const groq = getGroqClient();

  const chatHistory: Groq.Chat.ChatCompletionMessageParam[] = history.map((h) => ({
    role: h.sender === 'user' ? 'user' : 'assistant',
    content: h.text,
  }));

  let userMessage: Groq.Chat.ChatCompletionUserMessageParam = { role: 'user', content: message };
  let model = GROQ_TEXT_MODEL;

  if (attachment?.mimeType.startsWith('image/')) {
    model = GROQ_VISION_MODEL;
    userMessage = {
      role: 'user',
      content: [
        { type: 'text', text: message },
        { type: 'image_url', image_url: { url: attachment.dataUrl } },
      ],
    };
  } else if (attachment) {
    const extractedText = await extractDocumentText(attachment.dataUrl, attachment.mimeType);
    if (extractedText) {
      const label = attachment.fileName ? ` (${attachment.fileName})` : '';
      userMessage = {
        role: 'user',
        content: `${message}\n\n--- Conteúdo do arquivo anexado${label} ---\n${extractedText}`,
      };
    }
  }

  const completion = await groq.chat.completions.create({
    model,
    temperature: 0.7,
    messages: [{ role: 'system', content: CHAT_SYSTEM_PROMPT }, ...chatHistory, userMessage],
  });

  res.json({ success: true, reply: completion.choices[0]?.message?.content || '' });
});
