export const CSP_DIRECTIVES: Record<string, string[]> = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
  imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
  mediaSrc: ["'self'", 'data:', 'blob:', 'https://*.supabase.co'],
  connectSrc: [
    "'self'",
    'data:',
    'blob:',
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://api.pwnedpasswords.com',
    'https://*.sentry.io',
  ],
  frameSrc: ["'self'", 'data:', 'blob:', 'https://*.supabase.co'],
  workerSrc: ["'self'", 'blob:'],
  manifestSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
  upgradeInsecureRequests: [],
};

const toKebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export const CSP_HEADER_VALUE = Object.entries(CSP_DIRECTIVES)
  .map(([name, values]) => [toKebab(name), ...values].join(' '))
  .join('; ');
