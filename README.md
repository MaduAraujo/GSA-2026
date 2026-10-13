# Hub GSA 2026

PWA para Embaixadores(as) Estudantis do Google 2026: certificados, banco de prompts com IA, posts, desafios, sessões, galeria, pontuação semanal, prazos e portfólio público.

## Stack

| Camada       | Tecnologia                                                              |
| ------------ | ----------------------------------------------------------------------- |
| Front-end    | React 19 (React Compiler), React Router 8, TanStack Query 5, Tailwind 4 |
| Build        | Vite 8 (Rolldown), vite-plugin-pwa (Workbox)                            |
| Back-end     | Express 5 (local) / Vercel Functions (`api/index.ts`), Zod              |
| Dados e auth | Supabase (Postgres + RLS, Auth, Storage)                                |
| IA           | Groq (`groq-sdk`)                                                       |
| Qualidade    | TypeScript estrito, ESLint, Prettier, Vitest, Playwright, Husky         |
| Observação   | Sentry (opcional, via `VITE_SENTRY_DSN`)                                |

## Começando

Requer Node 22.12+ (o `.nvmrc` fixa a versão 24).

```bash
npm install
cp .env.example .env   # preencha as chaves do Supabase e do Groq
npm run dev            # http://localhost:3000 (Express + Vite com HMR)
```

## Scripts

| Comando                 | O que faz                                                    |
| ----------------------- | ------------------------------------------------------------ |
| `npm run dev`           | Servidor de desenvolvimento                                  |
| `npm run build`         | Build do front (`dist/`) e do servidor (`dist/server.cjs`)   |
| `npm run check`         | Tipos, lint, formatação e testes: o mesmo que o CI roda      |
| `npm test`              | Testes unitários e de integração (Vitest)                    |
| `npm run test:coverage` | Testes com relatório e limiares mínimos de cobertura         |
| `npm run test:e2e`      | Testes ponta a ponta (Playwright) contra o build de produção |
| `npm run lint:fix`      | Corrige o que o ESLint consegue                              |
| `npm run format`        | Formata tudo com o Prettier                                  |
| `npm run db:new <nome>` | Cria uma nova migration em `supabase/migrations/`            |
| `npm run db:push`       | Aplica as migrations pendentes no projeto Supabase           |
| `npm run db:types`      | Regenera `src/types/database.ts` a partir do banco           |

Na primeira execução do E2E, instale o navegador com `npx playwright install chromium`.

## Estrutura

```
src/
  app/            Shell autenticado, providers (auth, badges) e um contêiner por aba
  components/     Componentes de UI; módulos grandes divididos em subpastas por domínio
  data/           Queries e mutations (TanStack Query) e regras de dados
  hooks/          Hooks reutilizáveis (focus trap, dark mode, PWA, rascunhos persistidos)
  lib/            QueryClient, cache persistido e monitoramento
  server/         API Express: rotas de IA, push e cron, com validação Zod
  services/       Cliente Supabase, repositórios por domínio e cliente da API de IA
  shared/         Schemas Zod compartilhados entre cliente e servidor
  types/          Tipos de domínio e tipos gerados do banco
  routes.ts       Mapa de URLs das abas
  sw.ts           Service worker (precache Workbox e notificações push)
supabase/migrations/   Schema versionado
e2e/                   Testes Playwright, com Supabase simulado na camada de rede
```

## Banco de dados

O schema fica em `supabase/migrations/`. A migration base (`20260830000000_baseline.sql`) é idempotente e pode rodar num banco onde o schema já foi aplicado à mão.

Num projeto que já existia antes das migrations, marque a base como aplicada uma única vez:

```bash
npx supabase link --project-ref lcxpsdgeomtodzulpkhv
npx supabase migration repair --status applied 20260830000000
```

Depois, toda mudança de schema segue o mesmo fluxo: `npm run db:new <nome>`, editar o SQL, `npm run db:push` e `npm run db:types`.

## Deploy (Vercel)

A configuração fica em `vercel.ts`: rewrites da API e de SPA, cache dos assets e cron. Variáveis obrigatórias em produção: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET`. As de push (`VAPID_*`) e o Sentry (`VITE_SENTRY_DSN`) são opcionais.

## Qualidade

- **CI** (`.github/workflows/ci.yml`): tipos, lint, formatação, testes com limiar de cobertura, build, E2E e `npm audit` a cada push e PR.
- **Pre-commit** (Husky + lint-staged): ESLint e Prettier nos arquivos alterados, mais a checagem de tipos.
- **Dependabot**: atualizações semanais agrupadas.
- **Commits**: use [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat:`, `fix:`, `refactor:`, `test:`, `chore:` …).
