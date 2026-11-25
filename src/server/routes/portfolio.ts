import { Router } from 'express';
import { PUBLIC_SLUG_PATTERN, type PublicPortfolio } from '../../shared/publicPortfolio';
import { adminClient } from '../config';
import { HttpError, ipRateLimit } from '../http';

const USER_FILES_BUCKET = 'user-files';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export const portfolioRouter = Router();

portfolioRouter.use(ipRateLimit({ windowMs: 60_000, max: 60 }));

portfolioRouter.get('/:slug', async (req, res) => {
  if (!adminClient) {
    throw new HttpError(503, 'Portfólio público indisponível (SUPABASE_SERVICE_ROLE_KEY ausente).');
  }
  const slug = req.params.slug.toLowerCase();
  if (slug.length > 100 || !PUBLIC_SLUG_PATTERN.test(slug)) {
    throw new HttpError(404, 'Portfólio não encontrado.');
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, name, role, university, avatar_url')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new HttpError(404, 'Portfólio não encontrado.');

  const [certificates, badges] = await Promise.all([
    adminClient
      .from('certificates')
      .select('id, title, issuer, issue_date, description, hours, minutes, credential_url')
      .eq('user_id', profile.id)
      .eq('show_in_portfolio', true)
      .order('issue_date', { ascending: false }),
    adminClient
      .from('earned_badges')
      .select('id, file_name, file_path')
      .eq('user_id', profile.id)
      .eq('is_favorite', true)
      .order('created_at', { ascending: true }),
  ]);
  if (certificates.error) throw certificates.error;
  if (badges.error) throw badges.error;

  const badgeRows = badges.data ?? [];
  const signedUrls = new Map<string, string>();
  if (badgeRows.length > 0) {
    const { data, error } = await adminClient.storage.from(USER_FILES_BUCKET).createSignedUrls(
      badgeRows.map((b) => b.file_path),
      SIGNED_URL_TTL_SECONDS,
    );
    if (error) throw error;
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
    }
  }

  const body: PublicPortfolio = {
    profile: {
      name: profile.name ?? '',
      role: profile.role ?? '',
      university: profile.university ?? '',
      avatarUrl: profile.avatar_url ?? '',
    },
    certificates: (certificates.data ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      issuer: c.issuer,
      issueDate: c.issue_date,
      description: c.description,
      hours: c.hours ?? undefined,
      minutes: c.minutes ?? undefined,
      credentialUrl: c.credential_url ?? undefined,
    })),
    badges: badgeRows.map((b) => ({ id: b.id, fileName: b.file_name, url: signedUrls.get(b.file_path) })),
  };

  res.set('Cache-Control', 'no-store');
  res.json(body);
});
