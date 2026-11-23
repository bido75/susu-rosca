'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Browser Web Push opt-in. Free, no external provider — uses the installed PWA's
 * service worker. Shows an enable/disable toggle; disabled when unsupported or
 * when permission is denied (the browser controls the permission prompt).
 */
export default function PushNotifications() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !publicKey) return;
    setSupported(true);
    void refres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  async function refres() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub);
    } catch {
      /* ignore */
    }
  }

  async function enable() {
    if (!publicKey) return;
    setBusy(true);
    setMessage('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setMessage('Enable notifications in your browser settings to receive push alerts.');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const r = await fetch('/api/profile/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!r.ok) throw new Error('Failed to save subscription');
      setEnabled(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to enable notifications');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch('/api/profile/push-subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
      }
      setEnabled(false);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to disable notifications');
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {enabled ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
            <Bell className="w-4 h-4" /> Push notifications on
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
            <BellOff className="w-4 h-4" /> Push notifications off
          </span>
        )}
      </div>
      <button
        onClick={enabled ? disable : enable}
        disabled={busy}
        className={enabled ? 'btn-secondary text-xs' : 'btn text-xs'}
      >
        {busy ? 'Working…' : enabled ? 'Turn off push notifications' : 'Enable push notifications'}
      </button>
      {message && <p className="text-xs text-amber-600">{message}</p>}
    </div>
  );
}