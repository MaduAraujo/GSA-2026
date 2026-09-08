import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
}

const { groqCreateMock } = vi.hoisted(() => ({ groqCreateMock: vi.fn() }));

vi.mock('groq-sdk', () => ({
  default: class Groq {
    chat = { completions: { create: groqCreateMock } };
  },
}));

function mockAuthedSupabase(rpcMock?: ReturnType<typeof vi.fn>) {
  vi.doMock('@supabase/supabase-js', () => ({
    createClient: () => ({
      auth: { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) },
      rpc: rpcMock || vi.fn(),
    }),
  }));
}

describe('server/app', () => {
  beforeEach(() => {
    vi.resetModules();
    resetEnv();
    groqCreateMock.mockReset();
  });

  afterEach(() => {
    resetEnv();
  });

  it('GET /api/health reports whether the Groq key is configured', async () => {
    process.env.GROQ_API_KEY = '';
    process.env.VITE_SUPABASE_URL = '';
    process.env.VITE_SUPABASE_ANON_KEY = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    const { app } = await import('./app');

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.hasApiKey).toBe(false);
  });

  it('GET /api/push/vapid-public-key returns null when VAPID keys are not configured', async () => {
    process.env.VAPID_PUBLIC_KEY = '';
    process.env.VAPID_PRIVATE_KEY = '';
    const { app } = await import('./app');

    const res = await request(app).get('/api/push/vapid-public-key');
    expect(res.status).toBe(200);
    expect(res.body.publicKey).toBeNull();
  });

  it('rejects AI endpoints with 500 when server auth is not configured', async () => {
    process.env.VITE_SUPABASE_URL = '';
    process.env.VITE_SUPABASE_ANON_KEY = '';
    const { app } = await import('./app');

    const res = await request(app).post('/api/gemini/enhance-prompt').send({ prompt: 'oi' });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Autenticação do servidor não configurada/);
  });

  it('rejects AI endpoints with 401 when no bearer token is sent', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    const { app } = await import('./app');

    const res = await request(app).post('/api/gemini/enhance-prompt').send({ prompt: 'oi' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Não autenticado/);
  });

  it('rejects AI endpoints with 401 when the token is invalid', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({
        auth: { getUser: async () => ({ data: { user: null }, error: new Error('invalid') }) },
      }),
    }));
    const { app } = await import('./app');

    const res = await request(app)
      .post('/api/gemini/enhance-prompt')
      .set('Authorization', 'Bearer bad-token')
      .send({ prompt: 'oi' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Sessão inválida ou expirada/);
    vi.doUnmock('@supabase/supabase-js');
  });

  it('returns 400 from enhance-prompt when authenticated but the prompt is missing', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) },
      }),
    }));
    const { app } = await import('./app');

    const res = await request(app)
      .post('/api/gemini/enhance-prompt')
      .set('Authorization', 'Bearer good-token')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/prompt original é obrigatório/);
    vi.doUnmock('@supabase/supabase-js');
  });

  it('returns 500 from enhance-prompt when authenticated but GROQ_API_KEY is missing', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    process.env.GROQ_API_KEY = '';
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) },
      }),
    }));
    const { app } = await import('./app');

    const res = await request(app)
      .post('/api/gemini/enhance-prompt')
      .set('Authorization', 'Bearer good-token')
      .send({ prompt: 'Crie um post sobre GenAI' });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/GROQ_API_KEY/);
    vi.doUnmock('@supabase/supabase-js');
  });

  it('POST /api/cron/inactivity-scan rejects a wrong or missing cron secret', async () => {
    process.env.CRON_SECRET = 'top-secret';
    const { app } = await import('./app');

    const res = await request(app).post('/api/cron/inactivity-scan');
    expect(res.status).toBe(401);
  });

  it('POST /api/cron/inactivity-scan succeeds with the correct cron secret', async () => {
    process.env.CRON_SECRET = 'top-secret';
    process.env.VITE_SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    const { app } = await import('./app');

    const res = await request(app)
      .post('/api/cron/inactivity-scan')
      .set('Authorization', 'Bearer top-secret');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('enhance-prompt returns the Groq completion when everything is configured', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    process.env.GROQ_API_KEY = 'fake-groq-key';
    mockAuthedSupabase();
    groqCreateMock.mockResolvedValue({ choices: [{ message: { content: 'Prompt aprimorado!' } }] });
    const { app } = await import('./app');

    const res = await request(app)
      .post('/api/gemini/enhance-prompt')
      .set('Authorization', 'Bearer good-token')
      .send({ prompt: 'Crie um post', section: 'Estudos' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, enhanced: 'Prompt aprimorado!' });
    expect(groqCreateMock).toHaveBeenCalledWith(expect.objectContaining({ model: 'openai/gpt-oss-120b' }));
    vi.doUnmock('@supabase/supabase-js');
  });

  it('analyze-certificate returns 400 when the attached file has no readable text (non-image, non pdf/docx/xlsx)', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    process.env.GROQ_API_KEY = 'fake-groq-key';
    mockAuthedSupabase();
    const { app } = await import('./app');

    const res = await request(app)
      .post('/api/gemini/analyze-certificate')
      .set('Authorization', 'Bearer good-token')
      .send({ title: 'Cert', imageBase64: 'data:text/plain;base64,aGVsbG8=' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Não foi possível ler o conteúdo do arquivo/);
    expect(groqCreateMock).not.toHaveBeenCalled();
    vi.doUnmock('@supabase/supabase-js');
  });

  it('analyze-certificate parses the vision model JSON response for an image attachment', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    process.env.GROQ_API_KEY = 'fake-groq-key';
    mockAuthedSupabase();
    const analyzed = {
      suggestedTitle: 'Google Cloud Fundamentals',
      issuer: 'Google Cloud',
      category: 'Google Cloud',
      skills: ['GCP'],
      summary: 'Curso introdutório.',
      linkedinCaption: 'Concluí um curso!',
    };
    groqCreateMock.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(analyzed) } }] });
    const { app } = await import('./app');

    const res = await request(app)
      .post('/api/gemini/analyze-certificate')
      .set('Authorization', 'Bearer good-token')
      .send({ imageBase64: 'data:image/png;base64,AAA' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: analyzed });
    expect(groqCreateMock).toHaveBeenCalledWith(expect.objectContaining({ model: 'meta-llama/llama-4-scout-17b-16e-instruct' }));
    vi.doUnmock('@supabase/supabase-js');
  });

  it('chat returns the assistant reply', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    process.env.GROQ_API_KEY = 'fake-groq-key';
    mockAuthedSupabase();
    groqCreateMock.mockResolvedValue({ choices: [{ message: { content: 'Olá, tudo bem?' } }] });
    const { app } = await import('./app');

    const res = await request(app)
      .post('/api/gemini/chat')
      .set('Authorization', 'Bearer good-token')
      .send({ message: 'Oi!' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, reply: 'Olá, tudo bem?' });
    vi.doUnmock('@supabase/supabase-js');
  });

  it('blocks a request with 429 once the rate limit RPC says it is not allowed', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.GROQ_API_KEY = 'fake-groq-key';
    const rpcMock = vi.fn().mockResolvedValue({ data: false, error: null });
    mockAuthedSupabase(rpcMock);
    const { app } = await import('./app');

    const res = await request(app)
      .post('/api/gemini/enhance-prompt')
      .set('Authorization', 'Bearer good-token')
      .send({ prompt: 'oi' });

    expect(res.status).toBe(429);
    expect(rpcMock).toHaveBeenCalledWith(
      'check_and_increment_rate_limit',
      expect.objectContaining({ p_user_id: 'user-1' })
    );
    expect(groqCreateMock).not.toHaveBeenCalled();
    vi.doUnmock('@supabase/supabase-js');
  });

  it('fails open (allows the request) when the rate limit RPC itself errors', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.GROQ_API_KEY = 'fake-groq-key';
    const rpcMock = vi.fn().mockResolvedValue({ data: null, error: new Error('db unreachable') });
    mockAuthedSupabase(rpcMock);
    groqCreateMock.mockResolvedValue({ choices: [{ message: { content: 'ok' } }] });
    const { app } = await import('./app');

    const res = await request(app)
      .post('/api/gemini/enhance-prompt')
      .set('Authorization', 'Bearer good-token')
      .send({ prompt: 'oi' });

    expect(res.status).toBe(200);
    vi.doUnmock('@supabase/supabase-js');
  });

  it('POST /api/push/test returns 500 when VAPID keys are not configured', async () => {
    process.env.VAPID_PUBLIC_KEY = '';
    process.env.VAPID_PRIVATE_KEY = '';
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    mockAuthedSupabase();
    const { app } = await import('./app');

    const res = await request(app)
      .post('/api/push/test')
      .set('Authorization', 'Bearer good-token')
      .send({ subscription: { endpoint: 'https://push.example.com/abc' } });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Notificações push não configuradas/);
    vi.doUnmock('@supabase/supabase-js');
  });
});
