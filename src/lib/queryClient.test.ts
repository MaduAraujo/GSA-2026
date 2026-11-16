import { dehydrate } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { createQueryClient, NO_PERSIST_META, persistOptions } from './queryClient';

describe('query persistence', () => {
  it('keeps queries tagged NO_PERSIST_META out of localStorage, but persists the rest', async () => {
    const client = createQueryClient();
    await client.prefetchQuery({ queryKey: ['certificates'], queryFn: () => ['c1'] });
    await client.prefetchQuery({
      queryKey: ['public-portfolio', 'ana'],
      queryFn: () => ({ badges: [] }),
      meta: NO_PERSIST_META,
    });

    const persisted = dehydrate(client, persistOptions.dehydrateOptions).queries.map((q) => q.queryKey[0]);
    expect(persisted).toEqual(['certificates']);
  });
});
