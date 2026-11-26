<div align="center">

# Hub GSA 2026

### Portal dos Embaixadores(as) Estudantis do Google

[![Licença](https://img.shields.io/badge/licença-todos%20os%20direitos%20reservados-lightgrey?style=flat-square)](LICENSE)

**[→ Acessar](https://gsa-2026.vercel.app)**

</div>

---

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Inteligência Artificial](#inteligência-artificial)
- [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
- [Guia de Instalação](#guia-de-instalação)
- [Instruções de Uso](#instruções-de-uso)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Segurança](#segurança)
- [Limitações](#limitações)
- [Governança e Autoria](#governança-e-autoria)

---

## Sobre o Projeto

O **Hub GSA 2026** é um sistema web + PWA para os Embaixadores(as) Estudantis do Google 2026. Ele reúne num só lugar o que o programa pede: certificados e badges, banco de prompts, posts, desafios, sessões, galeria, pontuação semanal, prazos e um portfólio público para compartilhar as conquistas.

Antes do Hub, essas informações ficavam espalhadas entre planilhas, pastas no Drive, formulários e grupos de mensagem. O Hub organiza tudo por embaixador(a), lembra dos prazos e transforma o histórico do programa em um portfólio pronto para mostrar.

> **Nota de Escopo:** o Hub é uma ferramenta pessoal de cada embaixador(a). Não é um produto oficial do Google e não substitui os canais oficiais do programa.

### Demonstração

<p align="center">
  <img src="README/inicio.png" alt="Página inicial pública do Hub GSA 2026 com o botão Entrar" width="900">
  <br><em>Página inicial</em>
</p>

<p align="center">
  <img src="README/certificados.png" alt="Aba Certificados e Badges com a barra lateral, os totais de certificados e horas de estudo e a lista de certificados" width="900">
  <br><em>Certificados e badges</em>
</p>

<p align="center">
  <img src="README/prompts.png" alt="Banco de prompts com filtros por categoria e os botões Testar e Copiar em cada prompt" width="900">
  <br><em>Banco de prompts</em>
</p>

<p align="center">
  <img src="README/analytics.png" alt="Aba Analytics com gráficos de certificados, sessões e pontuação por mês, horas de estudo acumuladas e posts por plataforma e status" width="900">
  <br><em>Analytics</em>
</p>

**No celular**, a barra lateral vira uma barra inferior com as abas principais, e o restante fica no menu "Mais":

<table>
<tr>
<td align="center" width="25%"><img src="README/celular-inicio.png" alt="Página inicial no celular" width="200"><br><em>Página inicial</em></td>
<td align="center" width="25%"><img src="README/celular-certificados.png" alt="Certificados no celular" width="200"><br><em>Certificados</em></td>
<td align="center" width="25%"><img src="README/celular-prompts.png" alt="Prompts no celular" width="200"><br><em>Prompts</em></td>
<td align="center" width="25%"><img src="README/celular-menu.png" alt="Menu "Mais" no celular" width="200"><br><em>Menu "Mais"</em></td>
</tr>
</table>

<details>
<summary><strong>Ver todas as telas</strong></summary>

#### Páginas públicas

<table>
<tr>
<td align="center" width="50%"><img src="README/inicio.png" alt="Página inicial" width="440"><br><em>Página inicial</em></td>
<td align="center" width="50%"><img src="README/sobre.png" alt="Sobre o Programa" width="440"><br><em>Sobre o Programa</em></td>
</tr>
<tr>
<td align="center" width="50%"><img src="README/entrar.png" alt="Entrar" width="440"><br><em>Entrar</em></td>
<td align="center" width="50%"><img src="README/cadastro.png" alt="Criar conta" width="440"><br><em>Criar conta</em></td>
</tr>
<tr>
<td align="center" width="50%"><img src="README/privacidade.png" alt="Política de Privacidade" width="440"><br><em>Política de Privacidade</em></td>
<td align="center" width="50%"><img src="README/termos.png" alt="Termos de Uso" width="440"><br><em>Termos de Uso</em></td>
</tr>
<tr>
<td align="center" width="50%"><img src="README/portfolio.png" alt="Portfólio público" width="440"><br><em>Portfólio público</em></td>
<td></td>
</tr>
</table>

#### Conquistas

<table>
<tr>
<td align="center" width="50%"><img src="README/certificados.png" alt="Certificados e badges" width="440"><br><em>Certificados e badges</em></td>
<td align="center" width="50%"><img src="README/pontuacao.png" alt="Pontuação semanal" width="440"><br><em>Pontuação semanal</em></td>
</tr>
<tr>
<td align="center" width="50%"><img src="README/analytics.png" alt="Analytics" width="440"><br><em>Analytics</em></td>
<td></td>
</tr>
</table>

#### Produção

<table>
<tr>
<td align="center" width="50%"><img src="README/posts.png" alt="Posts" width="440"><br><em>Posts</em></td>
<td align="center" width="50%"><img src="README/prompts.png" alt="Prompts" width="440"><br><em>Prompts</em></td>
</tr>
<tr>
<td align="center" width="50%"><img src="README/galeria.png" alt="Galeria" width="440"><br><em>Galeria</em></td>
<td align="center" width="50%"><img src="README/referencias.png" alt="Referências" width="440"><br><em>Referências</em></td>
</tr>
</table>

#### Programa

<table>
<tr>
<td align="center" width="50%"><img src="README/sessoes.png" alt="Sessões" width="440"><br><em>Sessões</em></td>
<td align="center" width="50%"><img src="README/desafios.png" alt="Desafios" width="440"><br><em>Desafios</em></td>
</tr>
<tr>
<td align="center" width="50%"><img src="README/prazos.png" alt="Prazos" width="440"><br><em>Prazos</em></td>
<td align="center" width="50%"><img src="README/grupo-de-estudos.png" alt="Grupo de Estudos" width="440"><br><em>Grupo de Estudos</em></td>
</tr>
</table>

#### Informações

<table>
<tr>
<td align="center" width="50%"><img src="README/agenda.png" alt="Agenda" width="440"><br><em>Agenda</em></td>
<td align="center" width="50%"><img src="README/acervo.png" alt="Acervo de Encontros" width="440"><br><em>Acervo de Encontros</em></td>
</tr>
<tr>
<td align="center" width="50%"><img src="README/niveis.png" alt="Níveis" width="440"><br><em>Níveis</em></td>
<td align="center" width="50%"><img src="README/diretrizes.png" alt="Diretrizes" width="440"><br><em>Diretrizes</em></td>
</tr>
<tr>
<td align="center" width="50%"><img src="README/suporte.png" alt="Suporte" width="440"><br><em>Suporte</em></td>
<td></td>
</tr>
</table>

</details>

> As capturas usam dados fictícios.

---

## Funcionalidades

As abas ficam agrupadas na barra lateral (no celular, as principais ficam na barra inferior).

**Conquistas**

| Módulo           | Descrição                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Certificados** | Upload de certificados (PDF ou imagem) com preenchimento automático por IA, filtros, exportação e escolha do que aparece no portfólio. Inclui a seção **Badges**, com favoritos |
| **Pontuação**    | Pontuação semanal do programa                                                                                                                                                   |
| **Analytics**    | Gráficos dos últimos meses: certificados, sessões e pontuação por mês, horas de estudo acumuladas e posts por plataforma e por status                                           |

**Produção**

| Módulo          | Descrição                                                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Posts**       | Posts por plataforma e status (rascunho, agendado, publicado), com hashtags, sugestão de mídia e link da publicação                      |
| **Prompts**     | Banco de prompts por categoria, com variáveis preenchíveis, aprimoramento e teste por IA, biblioteca de documentos de apoio e exportação |
| **Galeria**     | Fotos e vídeos (até 50 MB) das atividades, com compressão em WebP no navegador                                                           |
| **Referências** | Links úteis, com quem compartilhou e anotações                                                                                           |

**Programa**

| Módulo               | Descrição                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| **Sessões**          | Registro das sessões conduzidas, separadas por tipo, com ferramentas usadas, materiais e mídia       |
| **Desafios**         | Desafios do programa por tipo e status, com plataforma, link da publicação e fotos, vídeos e músicas |
| **Prazos**           | Entregas do programa por semana, com pontos e aviso de atraso                                        |
| **Grupo de Estudos** | Eventos organizados pelo(a) embaixador(a)                                                            |

**Informações**

| Página                  | Descrição                                           |
| ----------------------- | --------------------------------------------------- |
| **Agenda**              | Calendário do programa                              |
| **Acervo de Encontros** | Encontros anteriores, cada um com resumo            |
| **Níveis**              | Níveis do programa, o nível atual e o próximo marco |
| **Diretrizes**          | Regras e boas práticas do programa                  |
| **Suporte**             | Canal de contato com a equipe                       |

Além das abas, há a página inicial pública, o **portfólio público** em `/p/:slug`, perfil, configurações (tema claro e escuro), notificações push e o guia de instalação do PWA.

---

## Inteligência Artificial

O Hub usa a API da [Groq](https://groq.com/), sempre pelo servidor: a chave da IA nunca chega ao navegador.

| Onde                    | O que faz                                                                                                                                | Modelo                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Certificados**        | Lê o certificado enviado e sugere título, emissor, categoria e habilidades                                                               | `GROQ_VISION_MODEL` (padrão `qwen/qwen3.8-27b`)  |
| **Prompts — Aprimorar** | Reescreve um prompt conforme o objetivo, com a lista de melhorias e uma dica                                                             | `GROQ_TEXT_MODEL` (padrão `openai/gpt-oss-120b`) |
| **Prompts — Testar**    | Executa o prompt e mostra a resposta. Aceita anexo: imagem vai para o modelo de visão; PDF, DOCX e XLSX têm o texto extraído no servidor | Texto ou visão, conforme o anexo                 |

**Cuidados:**

- **Só com login.** As rotas `/api/ai/*` exigem o token (JWT) do Supabase.
- **Limite de uso.** Cada usuário pode fazer até 30 chamadas a cada 10 minutos, controladas no banco (`check_and_increment_rate_limit`).
- **Validação.** Toda entrada passa por schemas Zod compartilhados entre cliente e servidor (`src/shared/aiSchemas.ts`).

---

## Arquitetura e Tecnologias

### Visão Geral

<p align="center">
  <img src="README/arquitetura.svg" alt="Diagrama de arquitetura: o navegador (PWA) carrega o front estático da Vercel, chama a API Express com o JWT do usuário e fala direto com o Supabase (Auth, PostgreSQL e Storage). A API usa a service_role no Supabase, chama a Groq para a IA e envia notificações Web Push; um cron diário da Vercel aciona o aviso de inatividade" width="840">
  <br><em>Arquitetura</em>
</p>

O navegador fala direto com o Supabase para os dados do dia a dia, usando o token do usuário logado. Quem decide o que cada pessoa pode ler ou alterar é o próprio PostgreSQL, pelas políticas de Row Level Security. O servidor Express só entra no que não pode rodar no navegador: IA, portfólio público, push e tarefas agendadas.

| Peça                | Papel                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Navegador (PWA)** | React com cache persistido (TanStack Query) e service worker com precache e notificações push                                             |
| **Vercel**          | Entrega os arquivos estáticos, roda a API (`api/index.ts`) como Vercel Function, envia os cabeçalhos de segurança e dispara o cron diário |
| **Auth**            | Login com e-mail e senha ou Google, confirmação de e-mail e redefinição de senha                                                          |
| **PostgreSQL**      | Tabelas por domínio com RLS por usuário e controle de limite de uso da IA                                                                 |
| **Storage**         | Certificados, badges, fotos, vídeos e materiais, por usuário                                                                              |
| **API (Express)**   | Rotas de IA, portfólio público, push e cron, com validação Zod                                                                            |
| **Groq**            | Modelos de IA, chamados só pelo servidor                                                                                                  |

### Stack

| Camada                      | Tecnologias                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Front-end**               | React 19 (React Compiler), React Router 8, TanStack Query 5, Tailwind 4, Motion, lucide-react                         |
| **Build**                   | Vite 8 (Rolldown), vite-plugin-pwa (Workbox)                                                                          |
| **Back-end**                | Express 5 (local) e Vercel Functions (produção), Zod, Helmet, web-push                                                |
| **Dados e auth**            | [Supabase](https://supabase.com/): PostgreSQL com RLS, Auth e Storage                                                 |
| **Inteligência Artificial** | API da [Groq](https://groq.com/) (`groq-sdk`)                                                                         |
| **Bibliotecas**             | ExcelJS (planilhas) · mammoth e pdf-parse (leitura de documentos anexados à IA) · canvas-confetti                     |
| **Qualidade**               | TypeScript estrito · ESLint · Prettier · Vitest + Testing Library · Playwright · Husky + lint-staged · GitHub Actions |
| **Observação**              | Sentry (opcional)                                                                                                     |
| **Hospedagem**              | Vercel (front e API) e Supabase (banco, auth e arquivos)                                                              |

### Features e Qualidade

- **Isolamento por usuário.** RLS em todas as tabelas. O portfólio público não abre o banco para anônimos: ele passa pela rota `/api/portfolio/:slug`, que só devolve o que a pessoa marcou como visível.
- **Offline e instalável.** PWA com precache dos assets e cache das consultas salvo no aparelho, então as telas abrem mesmo sem conexão.
- **Lembretes.** Notificações push e um cron diário que avisa quem está há 7 dias sem publicar.
- **Desfazer em vez de confirmar.** Exclusões mostram um aviso com "Desfazer" em vez de pedir confirmação.
- **Estado na URL.** Filtros e buscas ficam na URL, então uma tela filtrada pode ser compartilhada ou recarregada.
- **Acessibilidade.** Foco visível, armadilha de foco nos modais e navegação por teclado.
- **Testes e CI.** Um arquivo de teste para cada componente, serviço e rota, com cobertura mínima exigida no CI, e testes E2E com o Supabase simulado na camada de rede.

---

## Guia de Instalação

### Pré-requisitos

| Ferramenta                                   | Versão                                       | Para quê                                               |
| -------------------------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| [Git](https://git-scm.com/)                  | qualquer recente                             | Clonar o repositório                                   |
| [Node.js](https://nodejs.org/)               | **22.12 ou superior** (o `.nvmrc` fixa a 24) | Servidor local, build, testes e Supabase CLI via `npx` |
| Projeto no [Supabase](https://supabase.com/) | plano Free já serve                          | Banco, autenticação e arquivos                         |
| Conta na [Groq](https://console.groq.com/)   | plano gratuito já serve                      | Recursos de IA                                         |

### Passo a Passo de Configuração

#### 1. Clonar e Instalar Dependências

```bash
git clone https://github.com/MaduAraujo/GSA-2026.git
cd GSA-2026
npm install
```

#### 2. Configurar as Variáveis de Ambiente

```bash
cp .env.example .env
```

Preencha pelo menos `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `GROQ_API_KEY`. A lista completa está em [Variáveis de Ambiente](#variáveis-de-ambiente).

#### 3. Aplicar o Schema do Banco

O schema fica em `supabase/migrations/`. A migration base (`20260830000000_baseline.sql`) é idempotente, então pode rodar num banco onde o schema já foi aplicado à mão.

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npm run db:push
```

Num projeto que já existia antes das migrations, marque a base como aplicada uma única vez antes do `db:push`:

```bash
npx supabase migration repair --status applied 20260830000000
```

#### 4. Configurar Login e E-mails

Os modelos de e-mail ficam em `supabase/templates/`:

| Arquivo             | Modelo do Supabase | Assunto                               |
| ------------------- | ------------------ | ------------------------------------- |
| `confirmation.html` | Confirm signup     | Confirme seu cadastro no Hub GSA 2026 |
| `recovery.html`     | Reset Password     | Redefina sua senha do Hub GSA 2026    |

O `supabase/config.toml` já os usa no Supabase local. **O projeto hospedado não lê o `config.toml`:** cole o conteúdo de cada arquivo e o assunto em Authentication → Emails → Templates.

No painel do Supabase, configure também:

- **URL Configuration:** o **Site URL** (`https://gsa-2026.vercel.app`) e `https://gsa-2026.vercel.app/**` em **Redirect URLs**.
- **Google:** ative o provedor em Authentication → Providers para o botão "Entrar com Google".
- **SMTP:** o servidor padrão do Supabase envia poucos e-mails por hora e cai no spam com facilidade. Configure um SMTP próprio em Project Settings → Authentication → SMTP Settings.

#### 5. Rodar os Testes

```bash
npm test                # unidade e integração (Vitest)
npm run test:coverage   # o mesmo, exigindo a cobertura mínima do CI
npm run check           # tipos, lint, formatação e testes: o mesmo que o CI roda
```

Os testes E2E rodam contra o build de produção, com o Supabase simulado. Na primeira vez, instale o navegador:

```bash
npx playwright install chromium
npm run test:e2e
```

Tudo isso roda no CI a cada push e PR (`.github/workflows/ci.yml`): tipos, lint, formatação, testes com cobertura, build, E2E e `npm audit`.

### Variáveis de Ambiente

Todas ficam no `.env` (local) e nas Environment Variables do projeto na Vercel (produção). As que começam com `VITE_` vão para o navegador; as demais ficam só no servidor.

| Variável                                                        | Obrigatória            | Como obter                                                                                                                            |
| --------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`                  | **Sim**                | Supabase → Project Settings → API. A `anon key` é pública e protegida pela RLS                                                        |
| `GROQ_API_KEY`                                                  | Para a IA              | Crie em [console.groq.com](https://console.groq.com/keys)                                                                             |
| `GROQ_TEXT_MODEL` e `GROQ_VISION_MODEL`                         | Não                    | Trocam os modelos padrão sem mexer no código                                                                                          |
| `SUPABASE_SERVICE_ROLE_KEY`                                     | Em produção            | Supabase → Project Settings → API. Usada pelo portfólio público, pelo limite de uso da IA e pelo cron. **Nunca** vai para o navegador |
| `CRON_SECRET`                                                   | Em produção            | Qualquer texto aleatório longo, por exemplo `openssl rand -hex 32`. A Vercel o envia ao chamar o cron                                 |
| `APP_URL`                                                       | Não                    | Endereço público do app                                                                                                               |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_CONTACT_EMAIL` | Para notificações push | `npx web-push generate-vapid-keys`                                                                                                    |
| `VITE_SENTRY_DSN` e `VITE_APP_VERSION`                          | Não                    | Projeto no Sentry, para monitorar erros                                                                                               |

---

## Instruções de Uso

### Iniciar a Aplicação Localmente

```bash
npm run dev     # http://localhost:3000 (Express + Vite com HMR)
```

Para testar como fica em produção:

```bash
npm run build   # front em dist/ e servidor em dist/server.cjs
npm start
```

### Scripts

| Comando                 | O que faz                                                    |
| ----------------------- | ------------------------------------------------------------ |
| `npm run dev`           | Servidor de desenvolvimento                                  |
| `npm run build`         | Build do front (`dist/`) e do servidor (`dist/server.cjs`)   |
| `npm run check`         | Tipos, lint, formatação e testes                             |
| `npm test`              | Testes unitários e de integração (Vitest)                    |
| `npm run test:coverage` | Testes com relatório e limiares mínimos de cobertura         |
| `npm run test:e2e`      | Testes ponta a ponta (Playwright) contra o build de produção |
| `npm run lint:fix`      | Corrige o que o ESLint consegue                              |
| `npm run format`        | Formata tudo com o Prettier                                  |
| `npm run db:new <nome>` | Cria uma nova migration em `supabase/migrations/`            |
| `npm run db:push`       | Aplica as migrations pendentes no projeto Supabase           |
| `npm run db:types`      | Regenera `src/types/database.ts` a partir do banco           |

### Fluxo de Uso

1. **Crie a conta** em `/cadastro`, com e-mail e senha ou com o Google, e confirme o e-mail.
2. **Cadastre o que já tem:** certificados, badges, posts, sessões e desafios. No certificado, a IA preenche título, emissor e habilidades a partir do arquivo.
3. **Acompanhe o programa** pelas abas Prazos, Pontuação e Agenda, e ative as notificações push no perfil para receber lembretes.
4. **Compartilhe o portfólio:** defina o endereço público no perfil e escolha quais certificados e badges aparecem em `/p/seu-slug`.

### Exemplos de API

A API fica em `/api`. Troque `ACCESS_TOKEN` pelo token de uma sessão do Supabase.

**1. Saúde do servidor**

```bash
curl http://localhost:3000/api/health
```

```json
{ "status": "ok", "hasApiKey": true, "timestamp": "2026-11-26T12:00:00.000Z" }
```

**2. Aprimorar um prompt**

```bash
curl -X POST http://localhost:3000/api/ai/enhance-prompt \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"prompt":"Escreva um post sobre o Gemini","section":"Posts","objective":"Engajar estudantes"}'
```

```json
{ "success": true, "enhanced": "...", "improvements": ["..."], "tip": "..." }
```

**3. Portfólio público** (sem login, até 60 requisições por minuto por IP)

```bash
curl http://localhost:3000/api/portfolio/seu-slug
```

| Situação                  | Status | Corpo                                                |
| ------------------------- | ------ | ---------------------------------------------------- |
| Corpo inválido            | `400`  | `{"error":"O prompt original é obrigatório."}`       |
| Sem token                 | `401`  | `{"error":"Não autenticado."}`                       |
| Token inválido ou vencido | `401`  | `{"error":"Sessão inválida ou expirada."}`           |
| Portfólio inexistente     | `404`  | `{"error":"Portfólio não encontrado."}`              |
| Limite de uso atingido    | `429`  | `{"error":"Muitas requisições em pouco tempo. ..."}` |

---

## Estrutura de Diretórios

```text
GSA-2026/
├── index.html                  # entrada do app
├── server.ts                   # servidor local (Express + Vite)
├── vercel.ts                   # rewrites, cabeçalhos de segurança, cache e cron
├── api/index.ts                # API como Vercel Function
├── public/                     # manifesto e ícones do PWA
│
├── src/
│   ├── app/                    # shell autenticado, providers (auth, badges, toasts) e um contêiner por aba
│   ├── components/             # telas e componentes; módulos grandes em subpastas por domínio
│   │   └── ui/                 # componentes base: Modal, Button, PageHeader, EmptyState
│   ├── data/                   # queries e mutations (TanStack Query) e regras de dados
│   ├── hooks/                  # focus trap, tema escuro, PWA, estado na URL, rascunhos persistidos
│   ├── lib/                    # QueryClient, cache persistido e monitoramento
│   ├── server/                 # API Express: rotas de IA, portfólio, push e cron
│   ├── services/               # cliente Supabase, repositórios por domínio e cliente da API
│   ├── shared/                 # schemas Zod e CSP compartilhados entre cliente e servidor
│   ├── types/                  # tipos de domínio e tipos gerados do banco
│   ├── routes.ts               # mapa de URLs
│   └── sw.ts                   # service worker (precache e push)
│
├── supabase/
│   ├── migrations/             # schema versionado
│   ├── templates/              # e-mails de confirmação e de redefinição de senha
│   └── config.toml             # configuração do Supabase local
│
├── e2e/                        # testes Playwright, com Supabase simulado
└── .github/workflows/          # CI
```

**Onde fica cada coisa**

| Procurando…                 | Vá em                                                                    |
| --------------------------- | ------------------------------------------------------------------------ |
| Scripts de banco de dados   | `supabase/migrations/` (uma alteração por arquivo, com data no nome)     |
| Componentes visuais         | `src/components/` e, para os componentes base, `src/components/ui/`      |
| Acesso a dados              | `src/services/` (chamadas ao Supabase) e `src/data/` (cache e mutations) |
| Lógica que roda no servidor | `src/server/`                                                            |

---

## Segurança

| Camada                | Como o Hub protege                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| **Em trânsito**       | Todo o tráfego usa HTTPS (Vercel e Supabase)                                                           |
| **Acesso**            | Row Level Security em todas as tabelas e arquivos separados por usuário no Storage                     |
| **Portfólio público** | Sem políticas para anônimos: os dados passam pela API, que filtra o que é visível                      |
| **API**               | Rotas de IA só com token, limite de uso por usuário e por IP, e validação Zod de toda entrada          |
| **Front-end**         | Content-Security-Policy, `X-Frame-Options`, `nosniff` e `Permissions-Policy`, definidos em `vercel.ts` |
| **Chaves**            | `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `VAPID_PRIVATE_KEY` ficam só no servidor                 |

---

## Limitações

| Área         | Limitação                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Arquivos** | Vídeos e arquivos têm limite de 50 MB, o máximo do plano Free do Supabase. Pela API, o corpo da requisição é limitado a 4,5 MB pela Vercel |
| **E-mails**  | Sem SMTP próprio, o Supabase envia poucos e-mails por hora                                                                                 |
| **IA**       | Depende da disponibilidade da Groq e dos modelos que ela mantém no ar                                                                      |
| **Escopo**   | Cada conta é individual; não há visão de equipe ou de coordenação                                                                          |

---

## Governança e Autoria

### Como Contribuir

Contribuições passam por _pull request_ e só entram depois de revisadas. Antes de começar algo grande, abra uma _issue_ descrevendo a ideia.

**1. Faça um fork e clone a sua cópia**

```bash
git clone https://github.com/SEU_USUARIO/GSA-2026.git
cd GSA-2026
git remote add upstream https://github.com/MaduAraujo/GSA-2026.git
npm install
```

**2. Crie uma branch a partir da `main` atualizada**

```bash
git fetch upstream
git switch -c feature/nome-curto upstream/main
```

| Prefixo     | Quando usar                               | Exemplo                          |
| ----------- | ----------------------------------------- | -------------------------------- |
| `feature/`  | Funcionalidade nova                       | `feature/exportar-portfolio-pdf` |
| `fix/`      | Correção de bug                           | `fix/upload-video-galeria`       |
| `docs/`     | Só documentação                           | `docs/guia-instalacao`           |
| `test/`     | Só testes                                 | `test/modulo-prazos`             |
| `refactor/` | Mudança interna sem alterar comportamento | `refactor/modulo-sessoes`        |
| `chore/`    | Dependências, CI e configuração           | `chore/atualizar-vite`           |

Nomes em minúsculas, sem acento e com palavras separadas por hífen.

**3. Escreva os commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/)**

```text
<tipo>(<escopo opcional>): <descrição no imperativo, em minúsculas>
```

```bash
git commit -m "feat(prazos): mostrar pontos acumulados da semana"
git commit -m "fix(galeria): manter o arquivo ao editar sem novo upload"
git commit -m "docs: explicar variáveis de ambiente"
```

Os tipos são os mesmos dos prefixos de branch (`feat`, `fix`, `docs`, `test`, `refactor`, `chore`). Cada commit trata de um assunto só.

**4. Siga as convenções do projeto**

- O código não leva comentários; nomes claros de funções e variáveis fazem esse papel, e a explicação vai na descrição do PR.
- Toda mudança de comportamento vem com teste. O CI exige a cobertura mínima definida em `vitest.config.ts`.
- Mudança no banco vira uma migration nova (`npm run db:new <nome>`), seguida de `npm run db:types`.
- Cores e espaçamentos vêm dos tokens do tema (`@theme` em `src/index.css`), não de valores soltos.

**5. Confira tudo localmente antes de enviar**

```bash
npm run check
npm run test:e2e
```

O pre-commit (Husky + lint-staged) já roda ESLint, Prettier e a checagem de tipos nos arquivos alterados.

**6. Abra o Pull Request**

```bash
git push origin feature/nome-curto
```

No GitHub, abra o PR da sua branch para a `main` de `MaduAraujo/GSA-2026`. Na descrição, informe:

- **o que** mudou e **por quê**, com o número da _issue_, se houver;
- **como testar**, passo a passo;
- capturas de tela, se a interface mudou;
- migrations novas, se houver.

O PR só é aceito com o CI verde.

### Licença

**Todos os direitos reservados.** O código está público apenas para consulta. Copiar, modificar, distribuir ou usar o Hub em outros projetos depende de autorização prévia e por escrito da autora. Quem envia uma contribuição autoriza a autora a incorporá-la sob esses mesmos termos.

"Google" e os nomes do programa de Embaixadores(as) Estudantis são marcas de seus respectivos donos. Este é um projeto independente, sem vínculo oficial com o Google.

Texto completo em [LICENSE](LICENSE).

### Contatos

| Nome                 | Contato                                                   |
| -------------------- | --------------------------------------------------------- |
| Maria Eduarda Araújo | [LinkedIn](https://www.linkedin.com/in/mariaeduarda2801/) |
