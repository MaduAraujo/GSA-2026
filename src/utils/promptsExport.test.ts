import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportPromptsAsPdf } from './promptsExport';
import { makePrompt } from '../test/factories';

describe('exportPromptsAsPdf', () => {
  let writtenHtml = '';
  let fakeWindow: { document: { write: (html: string) => void; close: () => void }; focus: () => void; print: () => void };

  beforeEach(() => {
    vi.useFakeTimers();
    writtenHtml = '';
    fakeWindow = {
      document: {
        write: (html: string) => {
          writtenHtml = html;
        },
        close: vi.fn(),
      },
      focus: vi.fn(),
      print: vi.fn(),
    };
    vi.stubGlobal('open', vi.fn(() => fakeWindow as unknown as Window));
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('escapes HTML special characters in prompt text', () => {
    exportPromptsAsPdf([makePrompt({ promptText: '<b>bold</b> & italic' })]);
    expect(writtenHtml).not.toContain('<b>bold</b>');
    expect(writtenHtml).toContain('&lt;b&gt;bold&lt;/b&gt; &amp; italic');
  });

  it('sorts prompts by section then title', () => {
    exportPromptsAsPdf([
      makePrompt({ id: 'p1', section: 'Zebra', title: 'Z prompt' }),
      makePrompt({ id: 'p2', section: 'Alpha', title: 'A prompt' }),
    ]);
    expect(writtenHtml.indexOf('A prompt')).toBeLessThan(writtenHtml.indexOf('Z prompt'));
  });

  it('shows a fallback message when no prompts are selected', () => {
    exportPromptsAsPdf([]);
    expect(writtenHtml).toContain('Nenhum prompt selecionado.');
  });

  it('alerts and exits gracefully when the popup is blocked', () => {
    vi.stubGlobal('open', vi.fn(() => null));
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);

    expect(() => exportPromptsAsPdf([makePrompt()])).not.toThrow();
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('bloqueador de pop-ups'));
  });
});
