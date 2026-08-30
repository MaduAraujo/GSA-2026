import express from "express";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";

// Lazy Groq Client
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

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GROQ_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// 2. Generate Post for Google Ambassador
app.post("/api/gemini/generate-post", async (req, res) => {
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

// 3. Enhance / Optimize Prompt by Section
app.post("/api/gemini/enhance-prompt", async (req, res) => {
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

// 4. Analyze Certificate / Suggest Metadata & Post
app.post("/api/gemini/analyze-certificate", async (req, res) => {
  try {
    const { title, issuer } = req.body;

    const groq = getGroqClient();

    const systemInstruction = `Você é um assistente de reconhecimento de conquistas para a Embaixadora Estudantil do Google 2026.
Você analisa certificados e badges de cursos, workshops e eventos de tecnologia (Google Cloud, Gemini AI, Android, Machine Learning, Liderança, etc.).
Você deve sugerir tags, um resumo do impacto do aprendizado e um rascunho de postagem celebratória para o LinkedIn.
Responda sempre em JSON válido com a seguinte estrutura:
{
  "suggestedTitle": "string",
  "issuer": "string",
  "category": "Google Cloud" | "GenAI & Gemini" | "Liderança" | "Desenvolvimento" | "Comunidade",
  "skills": ["string", "string"],
  "summary": "string",
  "linkedinCaption": "string"
}`;

    const userText = `Analise este certificado de Embaixadora do Google 2026.
Título informado: ${title || "Não especificado"}
Emissor informado: ${issuer || "Google / Parceiro"}
Extraia e complete os detalhes em formato JSON.`;

    const completion = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userText },
      ],
    });

    let parsedData = {};
    try {
      parsedData = JSON.parse(completion.choices[0]?.message?.content || "{}");
    } catch {
      parsedData = {
        suggestedTitle: title || "Certificado Google 2026",
        issuer: issuer || "Google",
        category: "GenAI & Gemini",
        skills: ["Google AI", "Gemini", "Inovação"],
        summary: "Conquista completada com sucesso durante o programa Google Student Ambassador.",
        linkedinCaption: "Muito feliz em concluir mais uma certificação do programa Google Student Ambassador 2026! 🚀💙",
      };
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Erro ao analisar certificado:", error);
    return res.status(500).json({
      error: error.message || "Falha ao analisar certificado.",
    });
  }
});

// 5. Ambassador AI Copilot Chat
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
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

    // The client sends the full transcript on every turn (stateless server),
    // so the chat session is reconstructed with that history before replying.
    const chatHistory: Groq.Chat.ChatCompletionMessageParam[] = Array.isArray(history)
      ? history.map((h: { sender: string; text: string }) => ({
          role: h.sender === "user" ? "user" : "assistant",
          content: h.text,
        } as const))
      : [];

    const completion = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemInstruction },
        ...chatHistory,
        { role: "user", content: message },
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

// Vite & Static serving configuration
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Embaixadora Google 2026 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
