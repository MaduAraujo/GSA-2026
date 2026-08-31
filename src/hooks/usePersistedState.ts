import { useEffect, useState } from 'react';
export const PERSISTED_STATE_PREFIX = 'gsa_';

export function clearPersistedDrafts() {
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(PERSISTED_STATE_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {}
}

export function usePersistedState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState] as const;
}