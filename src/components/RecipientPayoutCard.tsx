'use client';

import { useCallback, useEffect, useState } from 'react';
import { Wallet, Copy, Check, AlertCircle, BadgeCheck } from 'lucide-react';
import { PAYOUT_KIND_LABEL } from '@/lib/payoutKinds';

type Props = {
  circleId: string;
  viewerId: string;
  recipientId: string | null;
  recipientName: string | null;
};

type Instructions = {
  id: string;
  version: number;
  kind: 'ZELLE' | 'CASHAPP' | 'VENMO' | 'ACH' | 'CASH';
  label: string | null;
  identifier: string;
  confirmedAt: string;
  recipientId: string;
  recipientName: string | null;
} | null;

type ConfirmedMethod = { id: string; kind: 'ZELLE' | 'CASHAPP' | 'VENMO'; identifier: string | null; label: string | null };

/**
 * Shows the current cycle recipient's payout instructions to authorized members.
 * The recipient can confirm (or change) which method to use for THIS cycle — which
 * creates the versioned snapshot payers see — and acknowledge/dispute receipt.
 */
export default function RecipientPayoutCard({ circleId, viewerId, recipientId, recipientName }: Props) {
  const [instructions, setInstructions] = useState<Instructions>(null);
  const [methods, setMethods] = useState<ConfirmedMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [ack, setAck] = useState<'idle' | 'RECEIVED' | 'NOT_RECEIVED'>('idle');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const isRecipient = recipientId !== null && recipientId === viewerId;

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/circles/${circleId}/payout-instructions`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to load instructions');
      setInstructions(j.instructions ?? null);

      if (viewerId && recipientId === viewerId) {
        const m = await fetch('/api/profile/payout-methods', { cache: 'no-store' });
        const mj = await m.json();
        const confirmed = (mj.methods ?? []).filter((x: { status: string }) => x.status === 'CONFIRMED');
        setMethods(confirmed);
        setSelectedMethod((prev) => prev || confirmed[0]?.id || '');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load instructions');
    }
  }, [circleId, viewerId, recipientId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyIdentifier() {
    if (!instructions?.identifier) return;
    try {
      await navigator.clipboard.writeText(instructions.identifier);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function confirmInstructions() {
    if (!selectedMethod) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/circles/${circleId}/payout-instructions/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receivingMethodId: selectedMethod }),
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

  async function submitAck(type: 'RECEIVED' | 'NOT_RECEIVED') {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/circles/${circleId}/payout-acknowledgment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, note: note || undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to submit');
      setAck(type);
      setNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to submit');
    } finally {
      setBusy(false);
    }
  }

  if (!recipientId) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <Wallet className="w-4 h-4 text-emerald-600" /> Recipient Payout Instructions
        </h3>
        {instructions && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
      </div>

      <p className="text-sm text-slate-700">
        <span className="font-semibold">{recipientName ?? 'The next recipient'}</span>
      </p>

      {!instructions ? (
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          {isRecipient ? 'Confirm how you want to receive this payout.' : 'The recipient has not confirmed payout instructions yet.'}
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm">
              <span className="text-xs text-slate-400 mr-1.5">{PAYOUT_KIND_LABEL[instructions.kind]}</span>
              <span className="font-mono font-semibold text-slate-800">{instructions.identifier}</span>
              {instructions.label && <span className="text-xs text-slate-400 ml-1.5">({instructions.label})</span>}
            </div>
            <button onClick={copyIdentifier} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Confirm the recipient identity in the app before sending money. This is how the recipient wants to be paid this cycle.
          </p>
        </div>
      )}

      {isRecipient && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          <p className="text-xs font-semibold text-slate-700">Confirm how you&apos;ll receive this cycle&apos;s payout</p>
          {methods.length === 0 ? (
            <p className="text-xs text-amber-600">
              You haven&apos;t added any payout methods. Add one on your profile first.
            </p>
          ) : (
            <>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="field"
              >
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {PAYOUT_KIND_LABEL[m.kind]} — {m.identifier}{m.label ? ` (${m.label})` : ''}
                  </option>
                ))}
              </select>
              <button onClick={confirmInstructions} disabled={busy || !selectedMethod} className="btn text-xs">
                {busy ? 'Confirming…' : instructions ? 'Update instructions for this cycle' : 'Confirm these instructions'}
              </button>
            </>
          )}
        </div>
      )}

      {isRecipient && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          {ack === 'idle' ? (
            <>
              <p className="text-xs text-slate-500">Have you received this payout?</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => submitAck('RECEIVED')} disabled={busy} className="btn text-xs">
                  I received it
                </button>
                <button onClick={() => submitAck('NOT_RECEIVED')} disabled={busy} className="btn-secondary text-xs">
                  Not received yet
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs font-semibold text-emerald-700">
              {ack === 'RECEIVED' ? 'Acknowledgment recorded.' : 'Discrepancy reported to the organizer.'}
            </p>
          )}
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}