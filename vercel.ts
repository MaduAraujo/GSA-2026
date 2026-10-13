import { routes } from '@vercel/config/v1';
import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  buildCommand: 'vite build',
  outputDirectory: 'dist',

  rewrites: [routes.rewrite('/api/(.*)', '/api/index'), routes.rewrite('/((?!api/).*)', '/index.html')],

  headers: [
    routes.cacheControl('/assets/(.*)', { public: true, maxAge: '1 year', immutable: true }),
    routes.header('/sw.js', [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }]),
    routes.header('/(.*)', [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]),
  ],

  crons: [{ path: '/api/cron/inactivity-scan', schedule: '0 13 * * *' }],
};
