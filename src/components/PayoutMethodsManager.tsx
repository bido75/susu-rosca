'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Star, Check, X, Landmark } from 'lucide-react';
import { PAYOUT_KIND_LABEL, PAYOUT_KIND_PLACEHOLDER, SELF_SERVE_KINDS, type PayoutKind } from '@/lib/payoutKinds';

type PayoutMethod = {
  id: string;
  kind: PayoutKind;
  identifier: string | null;
  label: string | null;
  status: 'ENTERED' | 'CONFIRMED' | 'DISABLED';
  isPreferred: boolean;
  confirmedAt: string | null;
};

export default function PayoutMethodsManager() {
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<string>('ZELLE');
  const [identifier, setIdentifier] = useState('');
  const [label, setLabel] = useState('');
  const [confirmEnrolled, setConfirmEnrolled] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/profile/payout-methods', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to load');
      setMethods(j.methods ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/profile/payout-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, identifier, label: label || undefined, confirm: confirmEnrolled }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to save');
      setAdding(false);
      setIdentifier('');
      setLabel('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save');
    } finally {
      setBusy(false);
    }
  }

  async function setPreferred(id: string) {
    setError('');
    try {
      const r = await fetch(`/api/profile/payout-methods/${id}/preferred`, { method: 'POST' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to set preferred');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to set preferred');
    }
  }

  async function toggleStatus(m: PayoutMethod) {
    setError('');
    const next = m.status === 'DISABLED' ? 'CONFIRMED' : 'DISABLED';
    try {
      const r = await fetch(`/api/profile/payout-methods/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to update');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remove this payout method?')) return;
    setError('');
    try {
      const r = await fetch(`/api/profile/payout-methods/${id}`, { method: 'DELETE' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to remove');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to remove');
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading payout methods…</p>;

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-xs p-3 rounded-xl bg-red-50 text-red-700">{error}</p>}

      {methods.length === 0 && !adding && (
        <p className="text-sm text-slate-500">
          You haven&apos;t added a payout method yet. Add how you&apos;d like to receive your Susu payout.
        </p>
      )}

      <ul className="divide-y divide-slate-100">
        {methods.map((m) => (
          <li key={m.id} className="py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{PAYOUT_KIND_LABEL[m.kind]}</span>
                {m.isPreferred && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3" /> Preferred
                  </span>
                )}
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    m.status === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : m.status === 'DISABLED'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {m.status === 'CONFIRMED' ? 'Member Confirmed' : m.status === 'DISABLED' ? 'Disabled' : 'Entered'}
                </span>
              </div>
              <p className="text-sm font-mono text-slate-600 mt-0.5">{m.identifier ?? '—'}</p>
              {m.label && <p className="text-xs text-slate-400">{m.label}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!m.isPreferred && m.status === 'CONFIRMED' && (
                <button onClick={() => setPreferred(m.id)} title="Set as preferred" aria-label="Set as preferred" className="p-2 text-slate-400 hover:text-emerald-600">
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => toggleStatus(m)} title={m.status === 'DISABLED' ? 'Re-enable' : 'Disable'} aria-label={m.status === 'DISABLED' ? 'Re-enable' : 'Disable'} className="p-2 text-slate-400 hover:text-slate-700">
                {m.status === 'DISABLED' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </button>
              <button onClick={() => remove(m.id)} title="Remove" aria-label="Remove" className="p-2 text-slate-400 hover:text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Method</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)} className="field">
                {SELF_SERVE_KINDS.map((k) => (
                  <option key={k} value={k}>{PAYOUT_KIND_LABEL[k]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Receiving identifier *</span>
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={PAYOUT_KIND_PLACEHOLDER[kind]} className="field" />
            </label>
          </div>
          <label className="block">
            <span className="label">Display label (optional)</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Personal Zelle" className="field" />
          </label>
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={confirmEnrolled} onChange={(e) => setConfirmEnrolled(e.target.checked)} className="mt-0.5 accent-emerald-600" />
            <span>I confirm this identifier is enrolled with {PAYOUT_KIND_LABEL[kind as keyof typeof PAYOUT_KIND_LABEL]} and is how I want to be paid.</span>
          </label>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5" />
            ACH bank payouts are not yet available and are never collected through this form.
          </p>
          <div className="flex gap-2">
            <button onClick={add} disabled={busy || identifier.trim().length < 2} className="btn text-sm">
              {busy ? 'Saving…' : 'Save method'}
            </button>
            <button onClick={() => setAdding(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="btn-secondary text-sm">
          <Plus className="w-4 h-4" /> Add another method
        </button>
      )}
    </div>
  );
}