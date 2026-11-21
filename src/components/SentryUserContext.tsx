'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Attaches the signed-in user's identity to the Sentry browser SDK so that
 * bug reports and captured errors can be attributed to the user who submitted
 * them. Runs once on mount, and is a no-op when the visitor is not signed in.
 */
export default function SentryUserContext() {
  useEffect(() => {
    let cancelled = false;

    fetch('/api/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user: { id: string; name: string; email: string } | null } | null) => {
        if (cancelled || !data?.user) return;
        Sentry.setUser({
          id: data.user.id,
          username: data.user.name,
          email: data.user.email,
        });
      })
      .catch(() => {
        /* never block the app on identity wiring */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}