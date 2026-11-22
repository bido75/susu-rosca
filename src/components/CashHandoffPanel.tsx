'use client';

import { useCallback, useEffect, useState } from 'react';
import { Banknote, Check, AlertCircle, ShieldCheck } from 'lucide-react';

type Props = {
  circleId: string;
  viewerId: string;
  isOrganizer: boolean;
  isRecipient: boolean;
  recipientName: string | null;
  totalPot: number;
};

type Handoff = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPUTED';
  amount: string;
  reason: string;
  proposedDate: string;
  arrangement: string;
  recipientUserId: string;
  witnessUserId: string | null;
  witness: { id: string; fullName: string } | null;
  confirmations: { role: 'PAYER' | 'RECIPIENT' | 'WITNESS'; userId: string; confirmedAt: string }[];
} | null;

/**
 * Exceptional cash payout workflow: the recipient requests cash, the organizer
 * approves (assigning an independent witness), and payer/recipient/witness each
 * confirm the handoff they personally observed. Documentation only — it never
 * moves money or auto-completes a disbursement.
 */
export default function CashHandoffPanel({ circleId, viewerId, isOrganizer, isRecipient, recipientName, totalPot }: Props) {
  const [handoff, setHandoff] = useState<Handoff>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [amount, setAmount] = useState(totalPot);
  const [reason, setReason] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [arrangement, setArrangement] = useState('');
  const [witnessSelect, setWitnessSelect] = useState('');
  const [witnessOptions, setWitnessOptions] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/circles/${circleId}/cash-handoff`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to load');
      setHandoff(j.request ?? null);
      if (j.request?.status === 'PENDING') {
        // Organizer may pick a witness among circle members (loaded separately).
        const m = await fetch(`/api/circles/${circleId}/cash-handoff-witnesses`, { cache: 'no-store' });
        if (m.ok) {
          const data = await m.json();
          setWitnessOptions(data.members ?? []);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load');
    }
  }, [circleId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitRequest() {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/circles/${circleId}/cash-handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) || totalPot, reason, proposedDate, arrangement }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to submit');
      setShowRequest(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to submit');
    } finally {
      setBusy(false);
    }
  }

  async function review(approve: boolean) {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/circles/${circleId}/cash-handoff/${handoff!.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approve ? { approve: true, witnessUserId: witnessSelect } : { approve: false, reason: 'Rejected by organizer' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to review');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to review');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRole(role: 'PAYER' | 'RECIPIENT' | 'WITNESS') {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/circles/${circleId}/cash-handoff/${handoff!.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to confirm');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to confirm');
    } finally {
      setBusy(false);
    }
  }

  const confirmationFor = (role: 'PAYER' | 'RECIPIENT' | 'WITNESS') =>
    handoff?.confirmations.find((c) => c.role === role) ?? null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-600" /> Cash Payout Exception
        </h3>
        {handoff && (
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              handoff.status === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-700'
                : handoff.status === 'REJECTED'
                  ? 'bg-rose-50 text-rose-700'
                  : handoff.status === 'DISPUTED'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
            }`}
          >
            {handoff.status}
          </span>
        )}
      </div>

      <div className="p-5 space-y-3">
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

        {!handoff && isRecipient && !showRequest && (
          <div>
            <p className="text-xs text-slate-500">
              Cash payouts are an exception and require organizer approval plus an independent witness during the handoff.
            </p>
            <button onClick={() => { setAmount(totalPot); setShowRequest(true); }} className="btn-secondary text-xs mt-2">
              Request a cash payout
            </button>
          </div>
        )}

        {!handoff && isRecipient && showRequest && (
          <div className="space-y-3">
            <label className="block">
              <span className="label">Amount ($)</span>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="field" />
            </label>
            <label className="block">
              <span className="label">Reason</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className="field" placeholder="Why cash is needed" />
            </label>
            <label className="block">
              <span className="label">Proposed handoff date</span>
              <input type="date" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)} className="field" />
            </label>
            <label className="block">
              <span className="label">Safe handoff arrangement</span>
              <input value={arrangement} onChange={(e) => setArrangement(e.target.value)} className="field" placeholder="e.g. meet at the public library" />
            </label>
            <div className="flex gap-2">
              <button onClick={submitRequest} disabled={busy || !reason.trim() || !proposedDate || !arrangement.trim()} className="btn text-xs">
                {busy ? 'Submitting…' : 'Submit request'}
              </button>
              <button onClick={() => setShowRequest(false)} className="btn-secondary text-xs">Cancel</button>
            </div>
          </div>
        )}

        {handoff && (
          <div className="space-y-2 text-sm">
            <p className="text-xs text-slate-500">
              {recipientName} requested <span className="font-bold">${Number(handoff.amount).toLocaleString()}</span> in cash
              {handoff.proposedDate ? ` on ${new Date(handoff.proposedDate).toLocaleDateString()}` : ''}.
            </p>
            <p className="text-xs text-slate-500">Reason: {handoff.reason}</p>
            <p className="text-xs text-slate-500">Arrangement: {handoff.arrangement}</p>

            {handoff.status === 'PENDING' && isOrganizer && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {witnessOptions.length > 0 && (
                  <select value={witnessSelect} onChange={(e) => setWitnessSelect(e.target.value)} className="field">
                    <option value="">Select an independent witness…</option>
                    {witnessOptions.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                )}
                <div className="flex gap-2">
                  <button onClick={() => review(true)} disabled={busy || !witnessSelect} className="btn text-xs">Approve + assign witness</button>
                  <button onClick={() => review(false)} disabled={busy} className="btn-secondary text-xs">Reject</button>
                </div>
              </div>
            )}

            {handoff.status === 'APPROVED' && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Witness: {handoff.witness?.fullName ?? 'Assigned'}
                </p>
                {(isOrganizer || isRecipient || (handoff.witnessUserId && handoff.witnessUserId === viewerId)) && (
                  <div className="flex flex-wrap gap-2">
                    {isOrganizer && !confirmationFor('PAYER') && (
                      <button onClick={() => confirmRole('PAYER')} disabled={busy} className="btn text-xs">Confirm I handed over cash</button>
                    )}
                    {isRecipient && !confirmationFor('RECIPIENT') && (
                      <button onClick={() => confirmRole('RECIPIENT')} disabled={busy} className="btn text-xs">Confirm I received cash</button>
                    )}
                    {handoff.witnessUserId === viewerId && !confirmationFor('WITNESS') && (
                      <button onClick={() => confirmRole('WITNESS')} disabled={busy} className="btn text-xs">Confirm I witnessed it</button>
                    )}
                  </div>
                )}
                {confirmationFor('PAYER') && confirmationFor('RECIPIENT') && confirmationFor('WITNESS') && (
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <Check className="w-4 h-4" /> All three confirmations recorded. Proceed to record the payout in the ledger above.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}