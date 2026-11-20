'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KycRequest({ status }: { status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (status === 'VERIFIED') return null;
  if (status === 'PENDING') {
    return <span className="text-xs text-amber-700">Pending review</span>;
  }

  return (
    <div>
      <button
        disabled={busy}
        className="btn-secondary text-xs"
        onClick={async () => {
          setBusy(true);
          setError('');
          const r = await fetch('/api/profile/kyc-request', { method: 'POST' });
          if (!r.ok) setError((await r.json()).error || 'Failed');
          else router.refresh();
          setBusy(false);
        }}
      >
        Request verification
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}