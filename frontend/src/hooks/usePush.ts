import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/client';

/**
 * Web-push підписка на сповіщення про новини.
 * Працює лише в браузерах що підтримують Service Worker + Push API,
 * і тільки на HTTPS (або localhost).
 */

type PushStatus = 'unsupported' | 'default' | 'granted' | 'denied' | 'subscribed';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

const isSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export function usePush() {
  const [status, setStatus] = useState<PushStatus>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupported()) {
      setStatus('unsupported');
      return;
    }
    // Перевіряємо чи вже підписані
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => {
        if (sub) setStatus('subscribed');
        else setStatus(Notification.permission as PushStatus);
      })
      .catch(() => setStatus(Notification.permission as PushStatus));
  }, []);

  const subscribe = useCallback(async (topics: string[] = ['news']) => {
    if (!isSupported()) return;
    setLoading(true);
    try {
      // 1. Дозвіл
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission as PushStatus);
        return;
      }

      // 2. VAPID ключ (з env або з API)
      let vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
      if (!vapidKey) {
        const { data } = await api.get('/push/vapid-key/');
        vapidKey = data.publicKey;
      }
      if (!vapidKey) {
        throw new Error('VAPID ключ недоступний');
      }

      // 3. Підписка через service worker
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      // 4. Відправляємо на бекенд (разом з обраними темами)
      await api.post('/push/subscribe/', { ...sub.toJSON(), topics });
      setStatus('subscribed');
      return true;
    } catch (e) {
      console.error('Push subscribe failed:', e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!isSupported()) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.post('/push/unsubscribe/', { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setStatus('default');
    } catch (e) {
      console.error('Push unsubscribe failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { status, loading, subscribe, unsubscribe, isSupported: isSupported() };
}
