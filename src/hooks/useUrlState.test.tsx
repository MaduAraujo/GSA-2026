import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useUrlFlag, useUrlState } from './useUrlState';

function wrapperAt(route: string) {
  return ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
}

describe('useUrlState', () => {
  it('reads the initial value from the URL', () => {
    const { result } = renderHook(() => useUrlState('q'), { wrapper: wrapperAt('/x?q=gemini') });
    expect(result.current[0]).toBe('gemini');
  });

  it('writes non-default values and drops the default from the URL', () => {
    const { result } = renderHook(() => [useUrlState('status', 'Todos'), useLocation()] as const, {
      wrapper: wrapperAt('/x'),
    });
    expect(result.current[0][0]).toBe('Todos');

    act(() => result.current[0][1]('Pendente'));
    expect(result.current[1].search).toBe('?status=Pendente');

    act(() => result.current[0][1]('Todos'));
    expect(result.current[1].search).toBe('');
  });

  it('keeps every update when several filters change in the same handler', () => {
    const { result } = renderHook(
      () => [useUrlState('q'), useUrlState('categoria', 'Todos'), useUrlFlag('fav'), useLocation()] as const,
      { wrapper: wrapperAt('/x?q=cloud&categoria=IA&fav=1') },
    );
    act(() => {
      result.current[0][1]('');
      result.current[1][1]('Todos');
      result.current[2][1](false);
    });
    expect(result.current[3].search).toBe('');
  });

  it('useUrlFlag stores true as 1 and removes the key when false', () => {
    const { result } = renderHook(() => [useUrlFlag('fav'), useLocation()] as const, { wrapper: wrapperAt('/x') });
    act(() => result.current[0][1](true));
    expect(result.current[0][0]).toBe(true);
    expect(result.current[1].search).toBe('?fav=1');
    act(() => result.current[0][1](false));
    expect(result.current[1].search).toBe('');
  });
});
