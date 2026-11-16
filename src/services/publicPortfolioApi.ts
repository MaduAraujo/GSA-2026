import type { PublicPortfolio } from '../shared/publicPortfolio';

export async function getPublicPortfolio(slug: string): Promise<PublicPortfolio | null> {
  const res = await fetch(`/api/portfolio/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Falha ao carregar o portfólio (HTTP ${res.status}).`);
  return (await res.json()) as PublicPortfolio;
}
