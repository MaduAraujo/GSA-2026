import express from 'express';
import helmet from 'helmet';
import { CSP_DIRECTIVES } from '../shared/csp.js';
import { isProduction } from './config.js';
import { errorHandler } from './http.js';
import { aiRouter } from './routes/ai.js';
import { portfolioRouter } from './routes/portfolio.js';
import { cronRouter, pushRouter, runInactivityPushScan } from './routes/push.js';

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
