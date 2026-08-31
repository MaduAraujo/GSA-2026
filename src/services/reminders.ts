const REMINDER_ENABLED_KEY = 'google_ambassador_reminders_enabled';
const LAST_REMINDER_SHOWN_KEY = 'google_ambassador_last_reminder_shown';
const REMINDER_INTERVAL_DAYS = 7;

export const RemindersService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  isEnabled(): boolean {
    return localStorage.getItem(REMINDER_ENABLED_KEY) === 'true';
  },

  getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async enable(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    localStorage.setItem(REMINDER_ENABLED_KEY, String(granted));
    return granted;
  },

  disable(): void {
    localStorage.setItem(REMINDER_ENABLED_KEY, 'false');
  },

  checkAndNotify(lastPostDate: string | null): void {
    if (!this.isSupported() || !this.isEnabled() || Notification.permission !== 'granted') return;

    const now = Date.now();
    const lastShown = Number(localStorage.getItem(LAST_REMINDER_SHOWN_KEY) || 0);
    const daysSinceShown = (now - lastShown) / (1000 * 60 * 60 * 24);
    if (daysSinceShown < REMINDER_INTERVAL_DAYS) return;

    const daysSincePost = lastPostDate
      ? (now - new Date(lastPostDate).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;
    if (daysSincePost < REMINDER_INTERVAL_DAYS) return;

    new Notification('Embaixadora Google 2026', {
      body: 'Já faz um tempo desde o seu último post! Que tal gerar um novo conteúdo com o Gemini hoje?',
      icon: '/icons/icon-192.svg',
      tag: 'weekly-content-reminder',
    });

    localStorage.setItem(LAST_REMINDER_SHOWN_KEY, String(now));
  },
};