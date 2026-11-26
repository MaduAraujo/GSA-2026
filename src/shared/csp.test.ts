import { describe, expect, it } from 'vitest';
import { config } from '../../vercel';
import { CSP_HEADER_VALUE } from './csp';

describe('Content-Security-Policy', () => {
  it('serializes directives in header syntax', () => {
    expect(CSP_HEADER_VALUE).toContain("default-src 'self'");
    expect(CSP_HEADER_VALUE).toContain("script-src 'self' https://accounts.google.com/gsi/client;");
    expect(CSP_HEADER_VALUE).toContain("object-src 'none'");
    expect(CSP_HEADER_VALUE).toContain('connect-src ');
    expect(CSP_HEADER_VALUE).toMatch(/upgrade-insecure-requests$/);
    expect(CSP_HEADER_VALUE).not.toContain("'unsafe-eval'");
    const frameSrc = CSP_HEADER_VALUE.split('; ').find((d) => d.startsWith('frame-src '));
    expect(frameSrc).toContain('https://accounts.google.com/gsi/');
  });

  it('is sent on every page served by Vercel', () => {
    const catchAll = config.headers?.find((h) => 'source' in h && h.source === '/(.*)');
    expect(catchAll && 'headers' in catchAll ? catchAll.headers : []).toContainEqual({
      key: 'Content-Security-Policy',
      value: CSP_HEADER_VALUE,
    });
  });
});
