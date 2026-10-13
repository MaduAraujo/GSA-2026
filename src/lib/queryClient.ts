import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const QUERY_CACHE_BUSTER = 'v5';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: ONE_DAY_MS,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

const safeLocalStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

export const queryPersister = createAsyncStoragePersister({
  storage: safeLocalStorage,
  key: 'gsa_query_cache',
  throttleTime: 1000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: ONE_DAY_MS,
  buster: QUERY_CACHE_BUSTER,
};
