'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker once the page has loaded. Registration is best
 * effort: failure is silently ignored so it can never break the app.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* ignore registration errors (e.g. non-secure context / unsupported) */
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
