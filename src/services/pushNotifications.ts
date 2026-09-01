import { SupabaseStorageService } from './supabaseStorage';
import { getAuthHeaders } from './supabaseClient';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function subscriptionToKeys(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh || '',
    auth: json.keys?.auth || '',
  };
}

export const PushNotificationsService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  },

  async getVapidPublicKey(): Promise<string> {
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) throw new Error('Servidor não configurou uma chave VAPID.');
    const data = await res.json();
    if (!data.publicKey) throw new Error('Notificações push não configuradas no servidor (faltando VAPID_PUBLIC_KEY).');
    return data.publicKey;
  },

  async ensureRegistration(): Promise<ServiceWorkerRegistration> {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    await navigator.serviceWorker.register('/sw.js');
    return navigator.serviceWorker.ready;
  },

  async getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    return registration.pushManager.getSubscription();
  },

  async subscribe(): Promise<void> {
    if (!this.isSupported()) throw new Error('Este navegador não suporta notificações push.');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Permissão de notificação negada.');

    const publicKey = await this.getVapidPublicKey();
    const registration = await this.ensureRegistration();

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const key = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key as unknown as BufferSource, 
      });
    }

    await SupabaseStorageService.savePushSubscription(subscriptionToKeys(subscription));
  },

  async unsubscribe(): Promise<void> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await SupabaseStorageService.deletePushSubscription(endpoint);
  },

  async sendTestPush(): Promise<void> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) throw new Error('Ative as notificações push primeiro.');

    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao enviar notificação de teste.');
    }
  },
};