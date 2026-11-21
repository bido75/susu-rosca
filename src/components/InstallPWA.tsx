'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Compass, Focus } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari full-screen/standalone flag
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Cross-platform install affordance:
 *  - Chromium (Android + desktop): surfaces the native `beforeinstallprompt`
 *    dialog via a floating "Install app" button.
 *  - iOS Safari: opens a short manual "Add to Home Screen" instruction sheet
 *    (iOS has no automated install prompt).
 * Renders nothing when already installed or unsupported.
 */
export default function InstallPWA() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIOSDevice() && !isStandalone());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setShowIOS(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
    } catch {
      /* user dismissed or prompt unavailable */
    }
    setDeferred(null);
  }, [deferred]);

  if (installed) return null;
  if (!deferred && !ios) return null;

  return (
    <>
      <div
        className="fixed right-3 sm:right-5 bottom-24 sm:bottom-6 z-[55]"
      >
        {ios ? (
          <button
            onClick={() => setShowIOS(true)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 shadow-lg shadow-slate-900/25 hover:bg-slate-800 transition"
          >
            <Share className="w-4 h-4" />
            Install app
          </button>
        ) : (
          <button
            onClick={install}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 shadow-lg shadow-emerald-900/25 hover:bg-emerald-700 transition"
          >
            <Download className="w-4 h-4" />
            Install SusuFlow
          </button>
        )}
      </div>

      {showIOS && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          onClick={() => setShowIOS(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 id="ios-install-title" className="font-bold text-slate-900">
                Install SusuFlow on iOS
              </h2>
              <button onClick={() => setShowIOS(false)} aria-label="Close" className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="px-5 py-4 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <Compass className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Open this page in <strong>Safari</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <Share className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tap the <strong>Share</strong> button at the bottom of the screen.</span>
              </li>
              <li className="flex items-start gap-3">
                <PlusSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Scroll and tap <strong>Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tap <strong>Add</strong>, then launch SusuFlow from your home screen like any app.</span>
              </li>
            </ol>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <Focus className="w-4 h-4 text-emerald-600 shrink-0" />
              Chrome users on iOS may also use the share menu to add the app.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
