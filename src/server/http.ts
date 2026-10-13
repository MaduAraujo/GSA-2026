import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { adminClient, authClient } from './config';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function parseBody<S extends z.ZodType>(req: Request, schema: S): z.infer<S> {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? 'Requisição inválida.');
  }
  return result.data;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!authClient) {
    return res
      .status(500)
      .json({ error: 'Autenticação do servidor não configurada (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes).' });
  }
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
  req.userId = data.user.id;
  next();
}

const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT_MAX_REQUESTS = 30;

export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  if (!adminClient || !req.userId) {
    return next();
  }
  const { data: allowed, error } = await adminClient.rpc('check_and_increment_rate_limit', {
    p_user_id: req.userId,
    p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    p_max_requests: RATE_LIMIT_MAX_REQUESTS,
  });
  if (error) {
    console.error('Erro ao checar rate limit:', error);
    return next();
  }
  if (!allowed) {
    return res
      .status(429)
      .json({ error: 'Muitas requisições em pouco tempo. Aguarde alguns minutos e tente novamente.' });
  }
  next();
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('Erro não tratado na API:', error);
  return res.status(500).json({ error: errorMessage(error, 'Erro interno do servidor.') });
}
