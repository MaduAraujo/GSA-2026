import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearPersistedDrafts, usePersistedState } from './usePersistedState';

describe('usePersistedState', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('starts with the default value when nothing is persisted', () => {
    const { result } = renderHook(() => usePersistedState('gsa_test_key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('persists updates to sessionStorage under the given key', () => {
    const { result } = renderHook(() => usePersistedState('gsa_test_key', 'default'));
    act(() => {
      result.current[1]('updated');
    });
    expect(result.current[0]).toBe('updated');
    expect(sessionStorage.getItem('gsa_test_key')).toBe(JSON.stringify('updated'));
  });

  it('hydrates from an existing sessionStorage value on mount', () => {
    sessionStorage.setItem('gsa_test_key', JSON.stringify({ open: true }));
    const { result } = renderHook(() => usePersistedState('gsa_test_key', { open: false }));
    expect(result.current[0]).toEqual({ open: true });
  });

  it('falls back to the default value when the stored JSON is corrupted', () => {
    sessionStorage.setItem('gsa_test_key', '{not valid json');
    const { result } = renderHook(() => usePersistedState('gsa_test_key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('clearPersistedDrafts only removes gsa_-prefixed keys', () => {
    sessionStorage.setItem('gsa_draft_a', '"1"');
    sessionStorage.setItem('gsa_draft_b', '"2"');
    sessionStorage.setItem('unrelated_key', '"keep me"');

    clearPersistedDrafts();

    expect(sessionStorage.getItem('gsa_draft_a')).toBeNull();
    expect(sessionStorage.getItem('gsa_draft_b')).toBeNull();
    expect(sessionStorage.getItem('unrelated_key')).toBe('"keep me"');
  });
});
