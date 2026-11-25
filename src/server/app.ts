import express from 'express';
import helmet from 'helmet';
import { CSP_DIRECTIVES } from '../shared/csp';
import { isProduction } from './config';
import { errorHandler } from './http';
import { aiRouter } from './routes/ai';
import { portfolioRouter } from './routes/portfolio';
import { cronRouter, pushRouter, runInactivityPushScan } from './routes/push';

export { runInactivityPushScan };

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: isProduction ? { useDefaults: false, directives: CSP_DIRECTIVES } : false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GROQ_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/ai', aiRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/push', pushRouter);
app.use('/api/cron', cronRouter);

app.use(errorHandler);

export default app;
