import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportPortfolioAsPdf } from './portfolioExport';
import { makeCertificate, makeProfile } from '../test/factories';

describe('exportPortfolioAsPdf', () => {
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

  it('escapes HTML special characters coming from user-entered fields', () => {
    exportPortfolioAsPdf(
      makeProfile({ name: '<script>alert(1)</script>', bio: 'A & B' }),
      [makeCertificate({ title: '<img src=x onerror=alert(1)>' })]
    );

    expect(writtenHtml).not.toContain('<script>alert(1)</script>');
    expect(writtenHtml).toContain('&lt;script&gt;');
    expect(writtenHtml).toContain('A &amp; B');
    expect(writtenHtml).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('shows a fallback message when there are no certificates', () => {
    exportPortfolioAsPdf(makeProfile(), []);
    expect(writtenHtml).toContain('Nenhum certificado cadastrado ainda.');
  });

  it('triggers print after opening the window', () => {
    exportPortfolioAsPdf(makeProfile(), [makeCertificate()]);
    vi.advanceTimersByTime(300);
    expect(fakeWindow.print).toHaveBeenCalledTimes(1);
  });

  it('alerts and exits gracefully when the popup is blocked', () => {
    vi.stubGlobal('open', vi.fn(() => null));
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);

    expect(() => exportPortfolioAsPdf(makeProfile(), [makeCertificate()])).not.toThrow();
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('bloqueador de pop-ups'));
  });
});
