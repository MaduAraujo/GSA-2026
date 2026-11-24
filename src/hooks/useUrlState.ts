import { useSearchParams } from 'react-router';

let pending: URLSearchParams | null = null;

function nextParams(current: URLSearchParams, key: string, value: string, defaultValue: string) {
  if (!pending) {
    pending = new URLSearchParams(current);
    queueMicrotask(() => {
      pending = null;
    });
  }
  if (value && value !== defaultValue) pending.set(key, value);
  else pending.delete(key);
  return new URLSearchParams(pending);
}

export function useUrlState(key: string, defaultValue = ''): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;
  const setValue = (next: string) => setParams(nextParams(params, key, next, defaultValue), { replace: true });
  return [value, setValue];
}

export function useUrlFlag(key: string): [boolean, (value: boolean) => void] {
  const [value, setValue] = useUrlState(key);
  return [value === '1', (on: boolean) => setValue(on ? '1' : '')];
}
