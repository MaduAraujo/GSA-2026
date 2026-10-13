import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import type { Database } from '../types/database';

dotenv.config();

export const isProduction = process.env.NODE_ENV === 'production';

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_CONTACT = process.env.VAPID_CONTACT_EMAIL || 'mailto:no-reply@example.com';

export const hasVapidKeys = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (hasVapidKeys) {
  const vapidSubject =
    /^mailto:/i.test(VAPID_CONTACT) || /^https?:\/\//i.test(VAPID_CONTACT) ? VAPID_CONTACT : `mailto:${VAPID_CONTACT}`;
  webpush.setVapidDetails(vapidSubject, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const authClient =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export const adminClient =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;
