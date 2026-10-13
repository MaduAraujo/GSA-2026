import express from 'express';
import helmet from 'helmet';
import { isProduction } from './config';
import { errorHandler } from './http';
import { aiRouter } from './routes/ai';
import { cronRouter, pushRouter, runInactivityPushScan } from './routes/push';

export { runInactivityPushScan };

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            mediaSrc: ["'self'", 'blob:', 'https://*.supabase.co'],
            connectSrc: [
              "'self'",
              'https://*.supabase.co',
              'wss://*.supabase.co',
              'https://api.pwnedpasswords.com',
              'https://*.ingest.sentry.io',
              'https://*.ingest.us.sentry.io',
            ],
            workerSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'self'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GROQ_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/ai', aiRouter);
app.use('/api/push', pushRouter);
app.use('/api/cron', cronRouter);

app.use(errorHandler);

export default app;
