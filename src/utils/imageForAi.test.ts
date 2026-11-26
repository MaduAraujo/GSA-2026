import { describe, expect, it } from 'vitest';
import { exceedsAiPayloadLimit, MAX_AI_PAYLOAD_CHARS } from './imageForAi';

describe('exceedsAiPayloadLimit', () => {
  it('accepts a payload exactly at the limit', () => {
    expect(exceedsAiPayloadLimit('a'.repeat(MAX_AI_PAYLOAD_CHARS))).toBe(false);
  });

  it('rejects a payload one character over the limit', () => {
    expect(exceedsAiPayloadLimit('a'.repeat(MAX_AI_PAYLOAD_CHARS + 1))).toBe(true);
  });

  it('keeps the limit below the 4.5MB Vercel request body cap', () => {
    expect(MAX_AI_PAYLOAD_CHARS).toBeLessThan(4.5 * 1024 * 1024);
  });
});
