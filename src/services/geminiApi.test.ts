import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeminiApiService } from './geminiApi';

vi.mock('./supabaseClient', () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: 'Bearer test-token' }),
}));

function mockFetchOnce(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe('GeminiApiService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('enhancePrompt posts the params with auth headers and returns the enhanced text', async () => {
    const fetchMock = mockFetchOnce(200, { success: true, enhanced: 'Prompt melhorado' });
    vi.stubGlobal('fetch', fetchMock);

    const result = await GeminiApiService.enhancePrompt({ prompt: 'Ideia', section: 'Estudos' });

    expect(result).toBe('Prompt melhorado');
    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({ prompt: 'Ideia', section: 'Estudos' }),
    });
  });

  it('enhancePrompt throws the server error message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(500, { error: 'Falha ao aprimorar prompt com o Groq.' }));
    await expect(GeminiApiService.enhancePrompt({ prompt: 'x', section: 'Estudos' })).rejects.toThrow(
      'Falha ao aprimorar prompt com o Groq.'
    );
  });

  it('enhancePrompt falls back to a generic message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error('not json'); } })
    );
    await expect(GeminiApiService.enhancePrompt({ prompt: 'x', section: 'Estudos' })).rejects.toThrow(
      'Falha ao aprimorar prompt.'
    );
  });

  it('analyzeCertificate returns the parsed data payload', async () => {
    const analyzed = { suggestedTitle: 'Cert', issuer: 'Google', category: 'GenAI & Gemini', skills: [], summary: '', linkedinCaption: '' };
    vi.stubGlobal('fetch', mockFetchOnce(200, { success: true, data: analyzed }));

    const result = await GeminiApiService.analyzeCertificate({ title: 'Cert', issuer: 'Google' });
    expect(result).toEqual(analyzed);
  });

  it('sendChatMessage sends the message, history and attachment and returns the reply', async () => {
    const fetchMock = mockFetchOnce(200, { success: true, reply: 'Olá!' });
    vi.stubGlobal('fetch', fetchMock);

    const history = [{ sender: 'user' as const, text: 'oi' }];
    const attachment = { dataUrl: 'data:image/png;base64,AAA', mimeType: 'image/png' };
    const result = await GeminiApiService.sendChatMessage('Como vai?', history, attachment);

    expect(result).toBe('Olá!');
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ message: 'Como vai?', history, attachment });
  });
});
