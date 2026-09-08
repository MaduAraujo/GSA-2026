import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PushNotificationsService } from './pushNotifications';

const { savePushSubscription, deletePushSubscription } = vi.hoisted(() => ({
  savePushSubscription: vi.fn().mockResolvedValue(undefined),
  deletePushSubscription: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./supabaseStorage', () => ({
  SupabaseStorageService: { savePushSubscription, deletePushSubscription },
}));

vi.mock('./supabaseClient', () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: 'Bearer test-token' }),
}));

function makeFakeSubscription(overrides: Partial<{ endpoint: string; keys: { p256dh: string; auth: string } }> = {}) {
  const endpoint = overrides.endpoint ?? 'https://push.example.com/abc';
  const keys = overrides.keys ?? { p256dh: 'p256dh-value', auth: 'auth-value' };
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
}

function stubServiceWorkerSupport({
  registration = null as any,
  registerResolvesTo = null as any,
}: { registration?: any; registerResolvesTo?: any } = {}) {
  vi.stubGlobal('PushManager', class {});
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      getRegistration: vi.fn().mockResolvedValue(registration),
      register: vi.fn().mockResolvedValue(registerResolvesTo),
      ready: Promise.resolve(registerResolvesTo),
    },
    configurable: true,
  });
}

describe('PushNotificationsService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    // @ts-expect-error - test-only cleanup of a property we defined ourselves
    delete navigator.serviceWorker;
  });

  it('reports unsupported when serviceWorker/PushManager are unavailable', () => {
    expect(PushNotificationsService.isSupported()).toBe(false);
  });

  it('reports supported once both APIs are present', () => {
    stubServiceWorkerSupport();
    expect(PushNotificationsService.isSupported()).toBe(true);
  });

  describe('getVapidPublicKey', () => {
    it('returns the public key from the server', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ publicKey: 'PUBLIC_KEY' }) }));
      expect(await PushNotificationsService.getVapidPublicKey()).toBe('PUBLIC_KEY');
    });

    it('throws when the endpoint itself fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
      await expect(PushNotificationsService.getVapidPublicKey()).rejects.toThrow('Servidor não configurou uma chave VAPID.');
    });

    it('throws when the server has no VAPID key configured', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ publicKey: null }) }));
      await expect(PushNotificationsService.getVapidPublicKey()).rejects.toThrow(/faltando VAPID_PUBLIC_KEY/);
    });
  });

  describe('getCurrentSubscription', () => {
    it('returns null when push is unsupported', async () => {
      expect(await PushNotificationsService.getCurrentSubscription()).toBeNull();
    });

    it('returns null when there is no service worker registration', async () => {
      stubServiceWorkerSupport({ registration: null });
      expect(await PushNotificationsService.getCurrentSubscription()).toBeNull();
    });

    it('delegates to the registrationpushManager', async () => {
      const subscription = makeFakeSubscription();
      stubServiceWorkerSupport({ registration: { pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) } } });
      expect(await PushNotificationsService.getCurrentSubscription()).toBe(subscription);
    });
  });

  describe('subscribe', () => {
    it('throws when the browser does not support push', async () => {
      await expect(PushNotificationsService.subscribe()).rejects.toThrow('Este navegador não suporta notificações push.');
    });

    it('throws when notification permission is denied', async () => {
      stubServiceWorkerSupport();
      vi.stubGlobal('Notification', { requestPermission: vi.fn().mockResolvedValue('denied') });
      await expect(PushNotificationsService.subscribe()).rejects.toThrow('Permissão de notificação negada.');
    });

    it('creates a new subscription when none exists yet and saves it', async () => {
      const newSubscription = makeFakeSubscription({ endpoint: 'https://push.example.com/new' });
      const pushManager = {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(newSubscription),
      };
      stubServiceWorkerSupport({ registration: { pushManager } });
      vi.stubGlobal('Notification', { requestPermission: vi.fn().mockResolvedValue('granted') });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ publicKey: 'QUJD' }) }));

      await PushNotificationsService.subscribe();

      expect(pushManager.subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }));
      expect(savePushSubscription).toHaveBeenCalledWith({ endpoint: 'https://push.example.com/new', p256dh: 'p256dh-value', auth: 'auth-value' });
    });

    it('reuses an existing subscription instead of creating a new one', async () => {
      const existing = makeFakeSubscription();
      const pushManager = { getSubscription: vi.fn().mockResolvedValue(existing), subscribe: vi.fn() };
      stubServiceWorkerSupport({ registration: { pushManager } });
      vi.stubGlobal('Notification', { requestPermission: vi.fn().mockResolvedValue('granted') });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ publicKey: 'QUJD' }) }));

      await PushNotificationsService.subscribe();

      expect(pushManager.subscribe).not.toHaveBeenCalled();
      expect(savePushSubscription).toHaveBeenCalledWith(expect.objectContaining({ endpoint: existing.endpoint }));
    });
  });

  describe('unsubscribe', () => {
    it('does nothing when there is no active subscription', async () => {
      await PushNotificationsService.unsubscribe();
      expect(deletePushSubscription).not.toHaveBeenCalled();
    });

    it('unsubscribes locally and removes the stored subscription', async () => {
      const subscription = makeFakeSubscription();
      stubServiceWorkerSupport({ registration: { pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) } } });

      await PushNotificationsService.unsubscribe();

      expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
      expect(deletePushSubscription).toHaveBeenCalledWith(subscription.endpoint);
    });
  });

  describe('sendTestPush', () => {
    it('throws when there is no active subscription', async () => {
      await expect(PushNotificationsService.sendTestPush()).rejects.toThrow('Ative as notificações push primeiro.');
    });

    it('posts the subscription and succeeds', async () => {
      const subscription = makeFakeSubscription();
      stubServiceWorkerSupport({ registration: { pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) } } });
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
      vi.stubGlobal('fetch', fetchMock);

      await PushNotificationsService.sendTestPush();

      const [, init] = fetchMock.mock.calls[0];
      expect(JSON.parse(init.body)).toEqual({ subscription: subscription.toJSON() });
    });

    it('throws the server error message when the test push fails', async () => {
      const subscription = makeFakeSubscription();
      stubServiceWorkerSupport({ registration: { pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) } } });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Falha ao enviar.' }) }));

      await expect(PushNotificationsService.sendTestPush()).rejects.toThrow('Falha ao enviar.');
    });
  });
});
