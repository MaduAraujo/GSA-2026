import { describe, it, expect } from 'vitest';
import { isHttpUrl } from './safeUrl';

describe('isHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isHttpUrl('https://example.com')).toBe(true);
    expect(isHttpUrl('http://example.com/path?x=1')).toBe(true);
  });

  it('rejects javascript: URIs', () => {
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: URIs', () => {
    expect(isHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects empty, null and undefined values', () => {
    expect(isHttpUrl('')).toBe(false);
    expect(isHttpUrl(null)).toBe(false);
    expect(isHttpUrl(undefined)).toBe(false);
  });

  it('rejects javascript: URIs regardless of case or leading whitespace', () => {
    expect(isHttpUrl('JAVASCRIPT:alert(1)')).toBe(false);
    expect(isHttpUrl('   javascript:alert(1)')).toBe(false);
  });

  it('treats a bare relative path as same-origin and therefore safe', () => {
    expect(isHttpUrl('/some/path')).toBe(true);
  });
});
