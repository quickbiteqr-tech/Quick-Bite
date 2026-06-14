// Local (in-tab) fallback notifications
export function notifyLocal(title: string, body?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try { new Notification(title, { body }); } catch {}
  }
}

async function ensurePermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

export async function registerPushForOrder(orderId: string) {
  if (typeof window === 'undefined') return;
  const ok = await ensurePermission();
  if (!ok) return;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  // Register SW once (no-op if already registered)
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    try { reg = await navigator.serviceWorker.register('/sw.js'); } catch { return; }
  }

  const vapidPubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPubKey) return;

  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    await saveSubscription(existing, orderId);
    return;
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPubKey)
  });

  await saveSubscription(sub, orderId);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function saveSubscription(subscription: PushSubscription, orderId: string) {
  const body = JSON.stringify({ orderId, subscription });
  await fetch('/api/push/subscribe', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body
  });
}
