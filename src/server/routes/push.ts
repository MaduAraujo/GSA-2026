import { Router, type Request, type Response } from 'express';
import webpush from 'web-push';
import { pushTestRequestSchema } from '../../shared/aiSchemas';
import { adminClient, hasVapidKeys, isProduction, VAPID_PUBLIC_KEY } from '../config';
import { HttpError, parseBody, requireAuth } from '../http';

const INACTIVITY_THRESHOLD_DAYS = 7;

export async function runInactivityPushScan() {
  if (!adminClient || !hasVapidKeys) return;

  const cutoff = new Date(Date.now() - INACTIVITY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: subscriptions, error } = await adminClient
    .from('push_subscriptions')
    .select('*')
    .or(`last_notified_at.is.null,last_notified_at.lt.${cutoff}`);
  if (error || !subscriptions?.length) return;

  for (const sub of subscriptions) {
    try {
      const { data: lastPost } = await adminClient
        .from('posts')
        .select('created_at')
        .eq('user_id', sub.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const isInactive = !lastPost?.created_at || new Date(lastPost.created_at).toISOString() < cutoff;
      if (!isInactive) continue;

      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: 'Embaixadora Google 2026',
          body: 'Já faz um tempo desde o seu último post! Que tal gerar um novo conteúdo com o Gemini hoje?',
          url: '/',
        }),
      );
      await adminClient
        .from('push_subscriptions')
        .update({ last_notified_at: new Date().toISOString() })
        .eq('id', sub.id);
    } catch (err) {
      const statusCode = (err as { statusCode?: number } | null)?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await adminClient.from('push_subscriptions').delete().eq('id', sub.id);
      } else {
        console.error('Erro ao enviar push de inatividade:', err);
      }
    }
  }
}

export const pushRouter = Router();

pushRouter.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || null });
});

pushRouter.post('/test', requireAuth, async (req, res) => {
  if (!hasVapidKeys) {
    throw new HttpError(
      500,
      'Notificações push não configuradas no servidor (faltando VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY).',
    );
  }
  const { subscription } = parseBody(req, pushTestRequestSchema);

  await webpush.sendNotification(
    subscription as webpush.PushSubscription,
    JSON.stringify({
      title: 'Embaixadora Google 2026',
      body: 'Notificação de teste — as notificações push estão funcionando! 🚀',
      url: '/',
    }),
  );
  res.json({ success: true });
});

export const cronRouter = Router();

async function handleInactivityScan(req: Request, res: Response) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && isProduction) {
    throw new HttpError(500, 'CRON_SECRET não configurado.');
  }
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    throw new HttpError(401, 'Não autorizado.');
  }
  await runInactivityPushScan();
  res.json({ success: true });
}

cronRouter.get('/inactivity-scan', handleInactivityScan);
cronRouter.post('/inactivity-scan', handleInactivityScan);
