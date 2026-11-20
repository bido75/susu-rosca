import { NextRequest, NextResponse } from 'next/server';

const BASE_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'" +
    (process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'") +
    "; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
};

function applyHeaders(res: NextResponse) {
  for (const [k, v] of Object.entries(BASE_HEADERS)) res.headers.set(k, v);
  // Only advertise HSTS once the app is actually served over HTTPS.
  if (process.env.APP_URL?.startsWith('https://')) {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return res;
}

export function proxy(req: NextRequest) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const expected = process.env.APP_URL ? new URL(process.env.APP_URL).origin : req.nextUrl.origin;
    if (!origin || origin !== expected) {
      return applyHeaders(NextResponse.json({ error: 'Invalid request origin' }, { status: 403 }));
    }
  }
  return applyHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|api/auth/verify).*)'],
};
