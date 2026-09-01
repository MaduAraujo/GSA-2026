import express from "express";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import ExcelJS from "exceljs";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_CONTACT = process.env.VAPID_CONTACT_EMAIL || "mailto:no-reply@example.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  const rawVapidSubject = VAPID_CONTACT;
  const vapidSubject = (/^mailto:/i.test(rawVapidSubject) || /^https?:\/\//i.test(rawVapidSubject))
    ? rawVapidSubject
    : `mailto:${rawVapidSubject}`;
  webpush.setVapidDetails(vapidSubject, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_DOCUMENT_CHARS = 12000;

function extractXlsxText(workbook: ExcelJS.Workbook): string {
  const parts: string[] = [];
  workbook.eachSheet((worksheet) => {
    parts.push(`## ${worksheet.name}`);
    worksheet.eachRow((row) => {
      const cells = (row.values as ExcelJS.CellValue[]).slice(1).map((v) => (v == null ? "" : String(v)));
      parts.push(cells.join(" | "));
    });
  });
  return parts.join("\n");
}

async function extractDocumentText(dataUrl: string, mimeType: string): Promise<string> {
  const base64 = dataUrl.split(",")[1] || "";
  const buffer: Buffer = Buffer.from(base64, "base64");
  const nodeBuffer: Buffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as any);

  try {
    if (mimeType === "application/pdf") {
      const parser = new PDFParse({ data: nodeBuffer });
      try {
        const result = await parser.getText();
        return (result.text || "").trim().slice(0, MAX_DOCUMENT_CHARS);
      } finally {
        await parser.destroy();
      }
    }
    if (mimeType === DOCX_MIME_TYPE) {
      const result = await mammoth.extractRawText({ buffer: nodeBuffer });
      return (result.value || "").trim().slice(0, MAX_DOCUMENT_CHARS);
    }
    if (mimeType === XLSX_MIME_TYPE) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(nodeBuffer as any);
      return extractXlsxText(workbook).trim().slice(0, MAX_DOCUMENT_CHARS);
    }
  } catch (error) {
    console.error("Erro ao extrair texto do arquivo anexado:", error);
    return "";
  }

  return "";
}

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("A chave GROQ_API_KEY não foi configurada nas variáveis de ambiente.");
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authClient = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const adminClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!authClient) {
    return res.status(500).json({ error: "Autenticação do servidor não configurada (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes)." });
  }
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
  req.userId = data.user.id;
  next();
}

const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT_MAX_REQUESTS = 30;

async function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!adminClient) {
    return next();
  }
  const { data: allowed, error } = await adminClient.rpc("check_and_increment_rate_limit", {
    p_user_id: req.userId,
    p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    p_max_requests: RATE_LIMIT_MAX_REQUESTS,
  });
  if (error) {
    console.error("Erro ao checar rate limit:", error);
    return next();
  }
  if (!allowed) {
    return res.status(429).json({ error: "Muitas requisições em pouco tempo. Aguarde alguns minutos e tente novamente." });
  }
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GROQ_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/gemini/generate-post", requireAuth, rateLimit, async (req, res) => {
  try {
    const {
      topic,
      platform = "LinkedIn",
      tone = "Inspirador & Profissional",
      category = "Estudos",
      keyPoints = "",
      callToAction = "",
      customInstructions = "",
    } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "O tema do post é obrigatório." });
    }

    const groq = getGroqClient();

    const systemInstruction = `Você é um mentor especialista em liderança e comunicação para Embaixadores Estudantis do Google 2026 (Google Student Ambassador 2026).
Seu objetivo é criar publicações de altíssimo engajamento, autênticas, inspiradoras e modernas para redes sociais (especialmente LinkedIn e Instagram), celebrando conquistas acadêmicas, workshops, estudos de Inteligência Artificial com Gemini, Google Cloud, comunidades de tecnologia e eventos estudantis.
Responda SEMPRE em Português do Brasil (pt-BR) com tom autêntico e linguagem visual limpa.
Estruture o resultado com:
1. Gancho irresistível (Headline / Primeira linha impactante)
2. Corpo do texto fluido (com quebras de linha confortáveis, emojis elegantes na medida certa e narrativa em 1ª pessoa)
3. Aprendizados / Destaques práticos (bullet points)
4. Chamada para Ação (CTA) instigando comentários ou compartilhamentos
5. 4 a 8 hashtags estratégicas (#GoogleStudentAmbassador #Google2026 #GeminiAI #GoogleCloud #MulheresNaTech #ComunidadeTech)`;

    const promptText = `Crie um post completo para a plataforma: **${platform}**
Tema Principal: "${topic}"
Categoria/Seção: ${category}
Tom de voz: ${tone}
Pontos-chave a incluir: ${keyPoints || "Foque na jornada de aprendizado, inovação e impacto comunitário como Embaixadora do Google"}
Chamada para Ação desejada: ${callToAction || "Pergunte a opinião da comunidade nos comentários"}
Instruções adicionais: ${customInstructions || "Nenhuma"}

Gere uma postagem pronta para copiar e publicar, formatada em Markdown de forma limpa. Ao final, sugira também uma ideia de imagem ou carrossel visual para acompanhar o post.`;

    const completion = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: promptText },
      ],
    });

    const generatedText = completion.choices[0]?.message?.content || "";
    return res.json({ success: true, post: generatedText });
  } catch (error: any) {
    console.error("Erro ao gerar post com Groq:", error);
    return res.status(500).json({
      error: error.message || "Falha ao gerar post com o Groq.",
    });
  }
});

app.post("/api/gemini/enhance-prompt", requireAuth, rateLimit, async (req, res) => {
  try {
    const { prompt, section = "Estudos", objective = "Melhorar clareza e resultados" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "O prompt original é obrigatório." });
    }

    const groq = getGroqClient();

    const systemInstruction = `Você é um engenheiro de prompts sênior especializado no ecossistema Google Gemini e Google AI Studio.
Sua missão é aprimorar prompts de estudantes e embaixadores do Google, transformando ideias simples em prompts estruturados de nível profissional com Persona, Contexto, Tarefa Clara, Restrições, Formato de Saída e Exemplos quando pertinentes.
Responda em Português do Brasil (pt-BR).`;

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
        { role: "system", content: systemInstruction },
        { role: "user", content: promptText },
      ],
    });

    return res.json({ success: true, enhanced: completion.choices[0]?.message?.content || "" });
  } catch (error: any) {
    console.error("Erro ao aprimorar prompt:", error);
    return res.status(500).json({
      error: error.message || "Falha ao aprimorar prompt com o Groq.",
    });
  }
});

app.post("/api/gemini/analyze-certificate", requireAuth, rateLimit, async (req, res) => {
  try {
    const { title, issuer, imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Envie o arquivo do certificado antes de usar o preenchimento automático." });
    }

    const groq = getGroqClient();

    const systemInstruction = `Você é um assistente de reconhecimento de conquistas para a Embaixadora Estudantil do Google 2026.
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

    const referenceHints = [
      title ? `Título digitado pelo usuário até agora (use apenas como referência secundária, priorize o que está escrito no certificado): ${title}` : null,
      issuer ? `Emissor digitado pelo usuário até agora (use apenas como referência secundária, priorize o que está escrito no certificado): ${issuer}` : null,
    ].filter(Boolean).join("\n");

    const instructionText = `Analise atentamente o certificado anexado e extraia título exato, instituição emissora, categoria, habilidades trabalhadas e um resumo fiel do conteúdo.
${referenceHints}
Responda apenas com o JSON no formato especificado, sem texto adicional.`;

    const mimeMatch = /^data:([^;]+);base64,/.exec(imageBase64);
    const mimeType = mimeMatch?.[1] || "";

    let rawContent = "";

    if (mimeType.startsWith("image/")) {
      const completion = await groq.chat.completions.create({
        model: GROQ_VISION_MODEL,
        messages: [
          { role: "system", content: systemInstruction },
          {
            role: "user",
            content: [
              { type: "text", text: instructionText },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
      });
      rawContent = completion.choices[0]?.message?.content || "";
    } else {
      const extractedText = await extractDocumentText(imageBase64, mimeType);
      if (!extractedText) {
        return res.status(400).json({
          error: "Não foi possível ler o conteúdo do arquivo. Tente uma imagem (PNG/JPG) ou verifique se o PDF contém texto selecionável.",
        });
      }

      const completion = await groq.chat.completions.create({
        model: GROQ_TEXT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `${instructionText}\n\n--- Conteúdo extraído do certificado ---\n${extractedText}` },
        ],
      });
      rawContent = completion.choices[0]?.message?.content || "";
    }

    let parsedData;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      return res.status(502).json({
        error: "Não foi possível interpretar a resposta da IA para este certificado. Tente novamente ou preencha manualmente.",
      });
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Erro ao analisar certificado:", error);
    return res.status(500).json({
      error: error.message || "Falha ao analisar certificado.",
    });
  }
});

app.post("/api/gemini/chat", requireAuth, rateLimit, async (req, res) => {
  try {
    const { message, history = [], attachment } = req.body as {
      message?: string;
      history?: { sender: string; text: string }[];
      attachment?: { dataUrl: string; mimeType: string; fileName?: string };
    };
    if (!message) {
      return res.status(400).json({ error: "A mensagem é obrigatória." });
    }

    const groq = getGroqClient();

    const systemInstruction = `Você é a "Gemini Ambassador Copilot", a assistente de IA oficial da Embaixadora Estudantil do Google 2026.
Você auxilia com:
- Ideias para workshops e palestras de Gemini e Google Cloud na universidade
- Criação de planos de estudo e maratonas de certificações Google
- Ideias de posts e conteúdos para redes sociais
- Estratégias de engajamento estudantil e eventos tech inclusivos
- Dicas de prompt engineering e uso avançado do Gemini.
Seu estilo é acolhedor, altamente inteligente, prático, motivador e focado no sucesso da embaixadora. Utilize formatação Markdown limpa.`;

    const chatHistory: Groq.Chat.ChatCompletionMessageParam[] = Array.isArray(history)
      ? history.map((h: { sender: string; text: string }) => ({
          role: h.sender === "user" ? "user" : "assistant",
          content: h.text,
        } as const))
      : [];

    let userMessage: Groq.Chat.ChatCompletionUserMessageParam = { role: "user", content: message };
    let model = GROQ_TEXT_MODEL;

    if (attachment?.dataUrl && attachment.mimeType?.startsWith("image/")) {
      model = GROQ_VISION_MODEL;
      userMessage = {
        role: "user",
        content: [
          { type: "text", text: message },
          { type: "image_url", image_url: { url: attachment.dataUrl } },
        ],
      };
    } else if (attachment?.dataUrl) {
      const extractedText = await extractDocumentText(attachment.dataUrl, attachment.mimeType);
      if (extractedText) {
        const label = attachment.fileName ? ` (${attachment.fileName})` : "";
        userMessage = {
          role: "user",
          content: `${message}\n\n--- Conteúdo do arquivo anexado${label} ---\n${extractedText}`,
        };
      }
    }

    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemInstruction },
        ...chatHistory,
        userMessage,
      ],
    });

    return res.json({ success: true, reply: completion.choices[0]?.message?.content || "" });
  } catch (error: any) {
    console.error("Erro no chat do Groq:", error);
    return res.status(500).json({
      error: error.message || "Falha no assistente Groq.",
    });
  }
});

app.get("/api/push/vapid-public-key", (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || null });
});

app.post("/api/push/test", requireAuth, async (req, res) => {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(500).json({ error: "Notificações push não configuradas no servidor (faltando VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY)." });
    }
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: "Assinatura de push inválida." });
    }

    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "Embaixadora Google 2026",
        body: "Notificação de teste — as notificações push estão funcionando! 🚀",
        url: "/",
      })
    );
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao enviar push de teste:", error);
    return res.status(500).json({ error: error.message || "Falha ao enviar notificação de teste." });
  }
});

const INACTIVITY_THRESHOLD_DAYS = 7;

export async function runInactivityPushScan() {
  if (!adminClient || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const cutoff = new Date(Date.now() - INACTIVITY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: subscriptions, error } = await adminClient
    .from("push_subscriptions")
    .select("*")
    .or(`last_notified_at.is.null,last_notified_at.lt.${cutoff}`);
  if (error || !subscriptions?.length) return;

  for (const sub of subscriptions) {
    try {
      const { data: lastPost } = await adminClient
        .from("posts")
        .select("created_at")
        .eq("user_id", sub.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastPostDate = lastPost?.created_at ? new Date(lastPost.created_at) : null;
      const isInactive = !lastPostDate || lastPostDate.toISOString() < cutoff;
      if (!isInactive) continue;

      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: "Embaixadora Google 2026",
          body: "Já faz um tempo desde o seu último post! Que tal gerar um novo conteúdo com o Gemini hoje?",
          url: "/",
        })
      );
      await adminClient.from("push_subscriptions").update({ last_notified_at: new Date().toISOString() }).eq("id", sub.id);
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await adminClient.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("Erro ao enviar push de inatividade:", err);
      }
    }
  }
}

app.post("/api/cron/inactivity-scan", async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization || "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Não autorizado." });
    }
  }
  try {
    await runInactivityPushScan();
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Erro no scan de inatividade:", error);
    return res.status(500).json({ error: error.message || "Falha no scan de inatividade." });
  }
});

export default app;