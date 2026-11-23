'use client';

import { useState } from 'react';
import { Smartphone } from 'lucide-react';

/**
 * Member phone number for SMS notifications. Normalized to E.164 server-side.
 * Empty input clears the number (opt out of SMS).
 */
export default function PhoneNumberField({ initial }: { initial: string | null }) {
  const [value, setValue] = useState(initial ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(initial ?? '');

  async function save() {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/profile/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: value }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to save');
      setSaved(j.phoneNumber ?? '');
      setValue(j.phoneNumber ?? '');
      setMessage(j.phoneNumber ? 'Phone number saved.' : 'Phone number removed.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Smartphone className="w-4 h-4 text-emerald-600" />
        <span>{saved ? `SMS to ${saved}` : 'No phone number set'}</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="tel"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="+1 555 123 4567"
          className="field flex-1"
          aria-label="Phone number for SMS notifications"
        />
        <button onClick={save} disabled={busy} className="btn text-xs shrink-0">
          {busy ? 'Saving…' : 'Save phone number'}
        </button>
      </div>
      <p className="text-[11px] text-slate-400">Leave empty and save to stop SMS alerts.</p>
      {message && <p className="text-xs text-emerald-700">{message}</p>}
    </div>
  );
}