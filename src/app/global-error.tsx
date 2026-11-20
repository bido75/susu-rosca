'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* `NextError` renders the default Next.js error page; status 0 because
            the App Router does not expose status codes for render errors. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}