'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, KeyRound } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function requestSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName: name || undefined }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || 'Unable to send the sign-in link.');
        return;
      }
      setMessage(d.message);
      setSent(true);
      setCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send the sign-in link.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || 'Invalid sign-in code.');
        return;
      }
      router.push('/circles');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid sign-in code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 card">
      <ShieldCheck size={44} className="text-emerald-600 mb-4" />
      <h1 className="text-3xl font-extrabold">Welcome to SusuFlow</h1>
      <p className="text-slate-500 mt-2 mb-8">Sign in securely with a one-time email link or a 6-digit code.</p>

      <form onSubmit={requestSignIn} className="space-y-4">
        <label>
          <span className="label">Full name (new accounts)</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
        </label>
        <label>
          <span className="label">Email address</span>
          <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <button disabled={busy} className="btn w-full">
          <Mail size={18} />
          {busy ? 'Sending...' : 'Send secure sign-in link'}
        </button>
      </form>

      {sent && (
        <form onSubmit={verifyCode} className="mt-6 space-y-4 border-t border-slate-100 pt-6">
          <label>
            <span className="label">6-digit sign-in code</span>
            <input
              className="field text-center text-2xl tracking-[0.5em] font-bold"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
            />
          </label>
          <button disabled={busy || code.length !== 6} className="btn w-full">
            <KeyRound size={18} />
            {busy ? 'Verifying...' : 'Verify code & sign in'}
          </button>
        </form>
      )}

      {message && <p role="status" className="mt-5 p-3 rounded-xl bg-emerald-50 text-sm">{message}</p>}
      {error && <p role="alert" className="mt-5 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</p>}

      <p className="text-xs text-slate-500 mt-5">
        For local development, the magic link and sign-in code appear in the server terminal when SMTP is not configured.
      </p>
    </div>
  );
}
