'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeftRight,
  Send,
  Sparkles,
  Wallet,
  Calendar,
  Award,
  FileCheck,
  History,
  LayoutDashboard,
  CircleDot,
  ChevronRight,
  X,
  Check,
  MessageSquare,
  Building2,
  Smartphone,
  Trophy,
  UserRound,
  LogOut,
  Bug,
  MoreHorizontal,
} from 'lucide-react';
import ReportBugButton from '@/components/ReportBugButton';

type Member = {
  id: string;
  userId: string;
  slotNumber: number | null;
  user: { id: string; fullName: string; susuTrustScore: number; email: string; phoneNumber: string | null };
};
type Contribution = {
  id: string;
  userId: string;
  amount: string;
  status: string;
  paymentMethod: string | null;
  externalTxRef: string | null;
  verifiedAt: string | null;
  user: { id: string; fullName: string };
  evidence: { id: string; fileName: string; mimeType: string }[];
};
type Cycle = {
  id: string;
  cycleNumber: number;
  recipientUserId: string | null;
  status: string;
  dueDate: string;
  disbursedAt: string | null;
  disbursementRef: string | null;
  contributions: Contribution[];
};
type Swap = { id: string; requesterId: string; targetId: string; status: string };
type Circle = {
  id: string;
  name: string;
  inviteCode: string;
  contributionAmount: string;
  currencySymbol: string;
  frequency: string;
  totalCycles: number;
  currentCycle: number;
  status: string;
  mode: string;
  fairValueSlots: boolean;
  startDate: string;
  createdBy: string;
  members: Member[];
  cycles: Cycle[];
  swaps: Swap[];
};
type CircleSummary = {
  id: string;
  name: string;
  contributionAmount: string;
  frequency: string;
  _count: { members: number };
};

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-teal-600',
  'bg-sky-600',
  'bg-amber-600',
  'bg-indigo-600',
  'bg-rose-600',
];

const WHEEL_COLORS = [
  '#059669',
  '#0d9488',
  '#0284c7',
  '#d97706',
  '#4f46e5',
  '#e11d48',
  '#7c3aed',
  '#0891b2',
];

const FREQ_LABEL: Record<string, string> = { WEEKLY: 'Weekly', BIWEEKLY: 'Bi-Weekly', MONTHLY: 'Monthly' };
const MODE_LABEL: Record<string, string> = {
  LEDGER: 'Ledger Mode (Zelle / Venmo / Cash)',
  AUTOMATED_SIMULATED: 'Automated ACH Mode',
};
const PAYMENT_LABEL: Record<string, string> = {
  ZELLE: 'Zelle',
  VENMO: 'Venmo',
  CASHAPP: 'Cash App',
  ACH: 'ACH Auto-Debit',
  CASH: 'Cash',
  OTHER: 'Other',
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function todayIso(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

export default function CircleWorkspace({
  id,
  section = 'overview',
  openCreate = false,
}: {
  id?: string;
  section?: 'overview' | 'wheel' | 'ledger' | 'audit';
  openCreate?: boolean;
}) {
  const router = useRouter();
  const [summaries, setSummaries] = useState<CircleSummary[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(id);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [viewerId, setViewerId] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'wheel' | 'ledger' | 'audit'>(section);
  const [isCreateOpen, setIsCreateOpen] = useState(openCreate);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [recentWinner, setRecentWinner] = useState<{ name: string; slot: number } | null>(null);
  const [swapA, setSwapA] = useState('');
  const [swapB, setSwapB] = useState('');

  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState(500);
  const [newFrequency, setNewFrequency] = useState('MONTHLY');
  const [newMode, setNewMode] = useState('LEDGER');
  const [newFairValue, setNewFairValue] = useState(true);
  const [newTotalCycles, setNewTotalCycles] = useState(6);
  const [newStartDate, setNewStartDate] = useState(todayIso());

  const [method, setMethod] = useState('ZELLE');
  const [txRef, setTxRef] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [payoutRef, setPayoutRef] = useState('');
  const [target, setTarget] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerToast = (title: string, message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ title, message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  const loadSummaries = useCallback(async () => {
    try {
      const r = await fetch('/api/circles', { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      setSummaries(j.circles ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadCircle = useCallback(
    async (circleId: string) => {
      try {
        const r = await fetch(`/api/circles/${circleId}`, { cache: 'no-store' });
        if (r.status === 401) {
          router.push('/login');
          return;
        }
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        setCircle(j.circle);
        setViewerId(j.viewerId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load');
      }
    },
    [router],
  );

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    if (id) setActiveId(id);
  }, [id]);

  useEffect(() => {
    if (activeId) {
      void loadCircle(activeId);
      const s = new EventSource(`/api/circles/${activeId}/events`);
      s.addEventListener('changed', () => void loadCircle(activeId));
      s.onerror = () => {};
      return () => s.close();
    }
  }, [activeId, loadCircle]);

  useEffect(() => {
    if (!activeId && summaries.length > 0) setActiveId(summaries[0].id);
  }, [activeId, summaries]);

  useEffect(() => {
    setActiveTab(section);
  }, [section]);

  // On first render with circle content loaded, jump to the section the route
  // (or URL hash) points at, so deep links like /circles/[id]/wheel still work.
  useEffect(() => {
    if (!circle) return;
    const hash = window.location.hash.replace('#', '');
    const target = hash || section;
    if (target && ['overview', 'wheel', 'ledger', 'audit'].includes(target)) {
      document.getElementById(target)?.scrollIntoView({ block: 'start' });
    }
    // Run once when the circle first becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circle]);

  // Scroll to a section within the single circle page. Every tab/section control
  // routes through this so that clicking a tab reveals the matching section (the
  // four sections are stacked on one page, each with a stable id). We also update
  // the URL hash (deep-linkable #overview/#wheel/#ledger/#audit) via history
  // replaceState so we don't pile up history entries or trigger a full re-fetch.
  function navigate(to: 'overview' | 'wheel' | 'ledger' | 'audit') {
    setActiveTab(to);
    const el = document.getElementById(to);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const target = activeId ? `/circles/${activeId}#${to}` : `#${to}`;
    window.history.replaceState(null, '', target);
  }

  async function act(path: string, body?: object) {
    setError('');
    setBusy(true);
    try {
      const r = await fetch(`/api/circles/${activeId}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Action failed');
      await loadCircle(activeId!);
      setTxRef('');
      setTarget('');
      return j;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function submitWithEvidence() {
    if (!activeId || txRef.trim().length < 3) return;
    setError('');
    setBusy(true);
    setUploading(!!evidenceFile);
    try {
      const r = await fetch(`/api/circles/${activeId}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method, externalTxRef: txRef }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Action failed');

      if (evidenceFile) {
        const fd = new FormData();
        fd.append('file', evidenceFile);
        const up = await fetch(`/api/circles/${activeId}/evidence`, { method: 'POST', body: fd });
        const uj = await up.json();
        if (!up.ok) throw new Error(uj.error || 'Evidence upload failed');
      }

      await loadCircle(activeId);
      setTxRef('');
      setEvidenceFile(null);
      triggerToast('Proof submitted', 'Your payment reference was submitted for organizer verification.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
      setUploading(false);
    }
  }

  // ---- derived ----
  const organizer = circle ? viewerId === circle.createdBy : false;
  const totalCycles = circle?.totalCycles ?? 0;
  const contribution = circle ? Number(circle.contributionAmount) : 0;
  const totalPot = contribution * totalCycles;
  const activeCycle = circle?.cycles.find((c) => c.cycleNumber === circle.currentCycle) ?? null;
  const contribByUser = useMemo(
    () => new Map((activeCycle?.contributions ?? []).map((c) => [c.userId, c])),
    [activeCycle],
  );

  const members = useMemo(() => {
    if (!circle) return [] as (Member & { payoutStatus: string; payoutDate: string; currentCycleStatus: string; paymentMethod: string; txRef: string })[];
    return [...circle.members].map((m) => {
      const s = m.slotNumber;
      const c = contribByUser.get(m.userId);
      let payoutStatus = 'Unassigned';
      if (s != null) {
        if (circle.status === 'COMPLETED') payoutStatus = 'Paid Out';
        else if (s < circle.currentCycle) payoutStatus = 'Paid Out';
        else if (s === circle.currentCycle) payoutStatus = 'Up Next';
        else payoutStatus = 'Upcoming';
      }
      const payoutDate = s != null ? circle.cycles[s - 1]?.dueDate ?? '' : '';
      const currentCycleStatus =
        c?.status === 'VERIFIED'
          ? 'Verified'
          : c?.status === 'SUBMITTED'
            ? 'Proof Uploaded'
            : c?.status === 'DEFAULTED'
              ? 'Defaulted'
              : 'Pending';
      return {
        ...m,
        payoutStatus,
        payoutDate,
        currentCycleStatus,
        paymentMethod: PAYMENT_LABEL[c?.paymentMethod ?? ''] ?? (circle.mode === 'AUTOMATED_SIMULATED' ? 'ACH Auto-Debit' : 'Zelle'),
        txRef: c?.externalTxRef ?? '',
      };
    });
  }, [circle, contribByUser]);

  const sortedBySlot = useMemo(
    () =>
      [...members].sort((a, b) => {
        if (a.slotNumber === null && b.slotNumber === null) return 0;
        if (a.slotNumber === null) return 1;
        if (b.slotNumber === null) return -1;
        return a.slotNumber - b.slotNumber;
      }),
    [members],
  );

  const verifiedCount = members.filter((m) => m.currentCycleStatus === 'Verified').length;
  const collectedAmount = verifiedCount * contribution;
  const collectionPercent = totalCycles ? Math.round((verifiedCount / totalCycles) * 100) : 0;
  const avgTrustScore = totalCycles
    ? Math.round(members.reduce((sum, m) => sum + m.user.susuTrustScore, 0) / totalCycles)
    : 0;
  const currentRecipient = circle
    ? members.find((m) => m.slotNumber === circle.currentCycle) ?? null
    : null;
  const unassignedCount = members.filter((m) => m.slotNumber === null).length;
  const isRotationComplete =
    !!circle && circle.status === 'COMPLETED' && circle.currentCycle === totalCycles;
  const allPaid =
    !!activeCycle &&
    activeCycle.contributions.length === totalCycles &&
    activeCycle.contributions.every((c) => c.status === 'VERIFIED');
  const ownContribution = activeCycle?.contributions.find((c) => c.userId === viewerId) ?? null;

  function getNetPayoutForSlot(slotNum: number | null): { amount: number; badge: string | null } {
    if (!circle?.fairValueSlots || !slotNum || totalCycles < 4) return { amount: totalPot, badge: null };
    const adjustment = Math.round(totalPot * 0.02);
    if (slotNum === 1 || slotNum === 2) return { amount: totalPot - adjustment, badge: `-$${adjustment} (2% Early Slot Fee)` };
    if (slotNum === totalCycles || slotNum === totalCycles - 1)
      return { amount: totalPot + adjustment, badge: `+$${adjustment} (2% Anchor Bonus)` };
    return { amount: totalPot, badge: 'Standard 100% Pot' };
  }

  async function handleDraw() {
    if (!circle || busy) return;
    setError('');
    setBusy(true);
    try {
      const r = await fetch(`/api/circles/${circle.id}/draw`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Draw failed');
      setIsSpinning(true);
      setRecentWinner(null);
      setWheelRotation((prev) => prev + 360 * 5 + (32 % 360));
      await loadCircle(circle.id);
      const winner = j.assignments?.[0];
      setTimeout(() => {
        setIsSpinning(false);
        if (winner) {
          const m = members.find((x) => x.userId === winner.userId);
          if (m) {
            setRecentWinner({ name: m.user.fullName, slot: m.slotNumber ?? 1 });
            triggerToast('Payout Order Assigned!', `${m.user.fullName} will collect Pot #1 first.`);
          }
        }
      }, 3200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Draw failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      triggerToast('Incomplete Circle Details', 'Please enter a circle name.', 'warning');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const r = await fetch('/api/circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          contributionAmount: Number(newAmount) || 100,
          frequency: newFrequency,
          totalCycles: Number(newTotalCycles) || 4,
          mode: newMode,
          fairValueSlots: newFairValue,
          startDate: newStartDate || todayIso(),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setIsCreateOpen(false);
      setActiveId(j.circle.id);
      setActiveTab('wheel');
      await loadSummaries();
      setNewName('');
      triggerToast('Circle Created!', 'Spin the Payout Wheel next to assign payout slots.');
      router.push(`/circles/${j.circle.id}/wheel`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create circle');
    } finally {
      setBusy(false);
    }
  }

  const navItems = [
    { id: 'overview' as const, label: 'Circle Overview', icon: LayoutDashboard, badge: null as string | null },
    { id: 'wheel' as const, label: 'Payout Wheel & Slots', icon: CircleDot, badge: unassignedCount > 0 ? `${unassignedCount} Open` : null },
    { id: 'ledger' as const, label: 'Contribution Ledger', icon: FileCheck, badge: totalCycles ? `${verifiedCount}/${totalCycles}` : null },
    { id: 'audit' as const, label: 'Payout & Audit Log', icon: History, badge: null },
  ];

  const freqShort = (f: string) => (f === 'MONTHLY' ? 'mo' : f === 'BIWEEKLY' ? '2wk' : 'wk');

  const renderLedgerActions = (m: (typeof members)[number], c: Contribution | undefined) => (
    <div className="flex flex-wrap items-center gap-2">
      {organizer && c?.status === 'SUBMITTED' && (
        <button disabled={busy} className="btn text-xs" onClick={() => act('verify', { contributionId: c.id })}>
          Verify
        </button>
      )}
      {organizer && (c?.status === 'SUBMITTED' || c?.status === 'PENDING') && (
        <button
          disabled={busy}
          className="text-xs text-rose-600 font-semibold hover:underline"
          onClick={() => {
            if (confirm(`Mark ${m.user.fullName} as defaulted? This applies a -10 trust score change.`)) act('default', { contributionId: c.id });
          }}
        >
          Default
        </button>
      )}
      {organizer && c?.status === 'PENDING' && (
        <button
          disabled={busy}
          className="text-xs text-emerald-700 font-semibold hover:underline"
          onClick={() => act('remind', { userId: m.userId })}
        >
          Remind
        </button>
      )}
      {!organizer && <span className="text-xs text-slate-500">{m.txRef || '—'}</span>}
    </div>
  );

  // ---- render ----
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans">
      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-24 sm:bottom-5 right-5 z-[60] max-w-md w-full px-4 pointer-events-none">
          <div
            className={`pointer-events-auto rounded-2xl shadow-xl border p-4 flex items-start gap-3 transition-all ${
              toast.type === 'warning'
                ? 'bg-amber-950 text-amber-50 border-amber-700'
                : toast.type === 'info'
                  ? 'bg-slate-900 text-white border-emerald-500/50'
                  : 'bg-emerald-950 text-emerald-50 border-emerald-600'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              ) : toast.type === 'info' ? (
                <MessageSquare className="w-5 h-5 text-emerald-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold">{toast.title}</p>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} aria-label="Dismiss notification" className="text-white/60 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* DARK SIDEBAR */}
      <aside className="pt-safe lg:w-72 bg-slate-900 text-slate-100 flex flex-col justify-between shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          <div className="p-5 flex items-center justify-between border-b border-slate-800">
            <Link href="/circles" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <RefreshCw className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-white">SusuFlow</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Beta
                  </span>
                </div>
                <p className="text-xs text-slate-400">Trusted Community ROSCA</p>
              </div>
            </Link>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-3 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              New Circle
            </button>
          </div>

          <div className="p-4 border-b border-slate-800/80">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Active Susu Circle ({summaries.length})
            </label>
            <div className="space-y-1.5">
              {summaries.map((c) => {
                const isSelected = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveId(c.id);
                      setActiveTab('overview');
                      if (id) router.replace(`/circles/${c.id}`);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between border ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                        : 'bg-slate-800/40 border-transparent text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ${Number(c.contributionAmount).toLocaleString()}/{freqShort(c.frequency)} • {c._count.members} members
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-3 w-full hidden lg:flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-emerald-950/40 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Create New Susu Circle
            </button>
          </div>

          <nav className="p-3 hidden lg:flex lg:flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                    active ? 'bg-slate-800 text-emerald-400 shadow-inner' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>0% Interest • 100% Transparent</span>
          </div>
          <p className="leading-relaxed">Every member contributes equally and receives the full pooled lump sum once per rotation.</p>
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-700/50 text-slate-300">
            <Link href="/profile" className="hover:text-emerald-400 flex items-center gap-1.5">
              <UserRound className="w-3.5 h-3.5" /> Profile
            </Link>
            <Link href="/admin/audit" className="hover:text-emerald-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Audit
            </Link>
            <ReportBugButton className="hover:text-emerald-400 flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5" /> Report a bug
            </ReportBugButton>
            <form action="/api/auth/logout" method="post" className="flex items-center gap-1.5 hover:text-emerald-400">
              <LogOut className="w-3.5 h-3.5" />
              <button type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 min-w-0 flex flex-col pb-24 lg:pb-0">
        {!circle ? (
          <div className="flex-1 flex items-center justify-center p-8">
            {summaries.length === 0 ? (
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg mb-5">
                  <RefreshCw className="w-8 h-8 text-slate-950 stroke-[2.5]" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">Start your first Susu circle</h1>
                <p className="text-slate-500 mt-2 mb-6">
                  Pool savings with people you trust and rotate the full lump-sum pot, interest-free.
                </p>
                <button onClick={() => setIsCreateOpen(true)} className="btn">
                  <Plus className="w-4 h-4" /> Create New Susu Circle
                </button>
              </div>
            ) : (
              <p className="text-slate-500">Loading your circle…</p>
            )}
          </div>
        ) : (
          <>
            <header className="bg-white border-b border-slate-200 px-5 sm:px-8 py-5">
              <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{circle.name}</h1>
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {circle.mode === 'AUTOMATED_SIMULATED' ? <Building2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                      {MODE_LABEL[circle.mode]}
                    </span>
                    {circle.fairValueSlots && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Sparkles className="w-3.5 h-3.5" />
                        Fair-Value Slots Active
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                        circle.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : circle.status === 'FORMING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {circle.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    ${contribution.toLocaleString()} {FREQ_LABEL[circle.frequency] ?? circle.frequency.toLowerCase()} contribution • {members.length}/{totalCycles} members • Cycle {circle.currentCycle} of {totalCycles}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-slate-500 border border-slate-200 rounded-lg px-2 py-1">{circle.inviteCode}</span>
                  {organizer && circle.status === 'FORMING' && members.length === totalCycles && (
                    <button
                      onClick={() => navigate('wheel')}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition cursor-pointer"
                    >
                      <CircleDot className="w-4 h-4" />
                      Spin Payout Wheel
                    </button>
                  )}
                  <button
                    onClick={() => navigate('ledger')}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Cycle {circle.currentCycle} Ledger
                  </button>
                  <button
                    className="btn-secondary text-xs sm:text-sm gap-1.5"
                    onClick={async () => {
                      await navigator.clipboard.writeText(`${location.origin}/join/${circle.inviteCode}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check size={16} /> : <Send size={16} />}
                    {copied ? 'Invite Copied' : 'Invite'}
                  </button>
                </div>
              </div>
            </header>

            {error && (
              <div className="px-5 sm:px-8 pt-4">
                <div role="alert" className="max-w-6xl mx-auto rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm">
                  {error}
                </div>
              </div>
            )}

            <section className="px-5 sm:px-8 pt-6">
              <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Lump-Sum Pot</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">${totalPot.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">
                      (${contribution} × {totalCycles})
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 font-medium mt-1.5">0% APR • Full principal payout</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rotation Progress</span>
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      Cycle {circle.currentCycle} of {totalCycles}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 truncate">
                    Next Payout:{' '}
                    <span className="font-semibold text-slate-900">
                      {activeCycle ? fmtDate(activeCycle.dueDate) : '—'}
                    </span>
                    {currentRecipient ? ` (${currentRecipient.user.fullName.split(' ')[0]})` : ''}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Circle Susu Score</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">{avgTrustScore}/100</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">High Trust</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">Peer-vouched & verified identities</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cycle {circle.currentCycle} Collection</span>
                    <span className="text-xs font-bold text-emerald-700">{collectionPercent}%</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-900">${collectedAmount.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">/ ${totalPot.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${collectionPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="px-5 sm:px-8 py-6 flex-1">
              <div className="max-w-6xl mx-auto">
                <section id="overview" className="scroll-mt-24">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                              <Sparkles className="w-3.5 h-3.5" />
                              {isRotationComplete ? 'Rotation Complete' : `Cycle ${circle.currentCycle} Pot Recipient`}
                            </span>
                            <h2 className="text-xl sm:text-2xl font-bold mt-1">
                              {currentRecipient ? `${currentRecipient.user.fullName} (Slot #${currentRecipient.slotNumber})` : 'Payout Order Not Yet Assigned'}
                            </h2>
                            <p className="text-sm text-slate-300 mt-1">
                              {currentRecipient
                                ? `Scheduled to receive $${getNetPayoutForSlot(currentRecipient.slotNumber).amount.toLocaleString()} on ${activeCycle ? fmtDate(activeCycle.dueDate) : '—'}.`
                                : 'Invite members to fill the circle, then draw the payout order with the Payout Wheel.'}
                            </p>
                          </div>
                          <button
                            onClick={() => navigate(currentRecipient ? 'ledger' : 'wheel')}
                            className={`shrink-0 font-semibold text-sm px-4 py-2.5 rounded-xl transition cursor-pointer ${
                              currentRecipient ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                            }`}
                          >
                            {currentRecipient ? `Manage Cycle ${circle.currentCycle} Pot` : 'Open Payout Wheel'}
                          </button>
                        </div>

                        <div className="mt-6 pt-5 border-t border-white/10">
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                            <span>Full Rotation Order</span>
                            <button onClick={() => navigate('wheel')} className="text-emerald-400 hover:underline font-medium">
                              Edit / Swap Slots →
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                            {Array.from({ length: totalCycles }, (_, i) => {
                              const m = sortedBySlot[i];
                              const assigned = m?.slotNumber === i + 1;
                              const isCurrent = assigned && i + 1 === circle.currentCycle;
                              const isPaid = assigned && (m as any)?.payoutStatus === 'Paid Out';
                              return (
                                <div
                                  key={i}
                                  className={`rounded-xl p-2.5 border text-left transition ${
                                    isCurrent ? 'bg-emerald-500/20 border-emerald-400' : isPaid ? 'bg-white/5 border-white/10 opacity-75' : 'bg-white/5 border-white/10'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[11px] font-semibold">
                                    <span className={isCurrent ? 'text-emerald-300' : 'text-slate-400'}>{m ? `Slot #${i + 1}` : 'Unassigned'}</span>
                                    {isPaid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                  </div>
                                  <p className="text-xs font-semibold text-white truncate mt-1">{m?.user.fullName.split(' ')[0] ?? '—'}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{m ? (m as any).payoutStatus : 'Open'}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900">Cycle {circle.currentCycle} Contributions</h3>
                            <p className="text-xs text-slate-500">
                              {verifiedCount} of {totalCycles} members verified (${collectedAmount.toLocaleString()} collected)
                            </p>
                          </div>
                          <button onClick={() => navigate('ledger')} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                            Full Verification Ledger →
                          </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {members.map((member, idx) => (
                            <div key={member.id} className="px-5 py-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                                  {initials(member.user.fullName)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{member.user.fullName}</p>
                                  <p className="text-xs text-slate-500">
                                    {member.paymentMethod}
                                    {member.txRef ? ` • ${member.txRef}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {member.currentCycleStatus === 'Verified' && (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Verified
                                  </span>
                                )}
                                {member.currentCycleStatus === 'Proof Uploaded' && organizer && (
                                  <button
                                    onClick={() => act('verify', { contributionId: (contribByUser.get(member.userId) as Contribution).id })}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    Tap to Verify
                                  </button>
                                )}
                                {member.currentCycleStatus === 'Pending' && (
                                  <button
                                    onClick={() => navigate('ledger')}
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                  >
                                    Submit Payment
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-slate-900">Recent Circle Activity</h3>
                          <button onClick={() => navigate('audit')} className="text-xs font-semibold text-emerald-700 hover:underline">
                            View All
                          </button>
                        </div>
                        <div className="space-y-4">
                          {circle.swaps.length === 0 && !activeCycle && (
                            <p className="text-xs text-slate-500">No activity yet — draw the payout order to get started.</p>
                          )}
                          {activeCycle && (
                            <p className="text-xs text-slate-500">Payout due {fmtDate(activeCycle.dueDate)}.</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200/80 p-5">
                        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Circle Governance Rules</span>
                        </div>
                        <ul className="mt-3 space-y-2 text-xs text-emerald-950/80 leading-relaxed">
                          <li>
                            • <strong>Equal Stake:</strong> Every member pays ${contribution} per {FREQ_LABEL[circle.frequency]?.toLowerCase()} cycle.
                          </li>
                          <li>
                            • <strong>Fair-Value Slots:</strong>{' '}
                            {circle.fairValueSlots
                              ? 'Enabled — Slots 1 & 2 contribute a 2% early-access fee distributed as a bonus to the final 2 anchor slots.'
                              : 'Disabled — Every slot receives the exact flat pot amount.'}
                          </li>
                          <li>
                            • <strong>Peer Slot Trading:</strong> Members may swap upcoming payout slots with mutual consent.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="wheel" className="scroll-mt-24">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
                      <div className="w-full flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Transparent Slot Draw</span>
                        <span className="text-xs text-slate-500 font-medium">{unassignedCount} unassigned</span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-1">Payout Order Wheel</h2>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xs">
                        {circle.status === 'FORMING'
                          ? 'Spin to assign the full payout order fairly in front of the group.'
                          : 'The payout order is locked. Use the Slot Swap tool to trade future positions.'}
                      </p>

                      <div className="relative my-6 w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                        <div className="absolute -top-3 z-20 drop-shadow-md">
                          <svg width="28" height="28" viewBox="0 0 28 28">
                            <polygon points="14,26 2,4 26,4" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
                          </svg>
                        </div>
                        <svg
                          viewBox="0 0 200 200"
                          className="w-full h-full drop-shadow-lg"
                          style={{
                            transform: `rotate(${wheelRotation}deg)`,
                            transition: isSpinning ? 'transform 3.2s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none',
                          }}
                        >
                          {members.map((member, index) => {
                            const count = members.length || 1;
                            const angle = 360 / count;
                            const startAngle = index * angle - 90;
                            const endAngle = startAngle + angle;
                            const startRad = (Math.PI / 180) * startAngle;
                            const endRad = (Math.PI / 180) * endAngle;
                            const x1 = 100 + 95 * Math.cos(startRad);
                            const y1 = 100 + 95 * Math.sin(startRad);
                            const x2 = 100 + 95 * Math.cos(endRad);
                            const y2 = 100 + 95 * Math.sin(endRad);
                            const largeArcFlag = angle > 180 ? 1 : 0;
                            const d = `M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                            const midAngle = startAngle + angle / 2;
                            const midRad = (Math.PI / 180) * midAngle;
                            const textX = 100 + 58 * Math.cos(midRad);
                            const textY = 100 + 58 * Math.sin(midRad);
                            const isAssigned = member.slotNumber !== null;
                            const fill = isAssigned ? '#94a3b8' : WHEEL_COLORS[index % WHEEL_COLORS.length];
                            return (
                              <g key={member.id}>
                                <path d={d} fill={fill} stroke="#ffffff" strokeWidth="2" />
                                <text
                                  x={textX}
                                  y={textY}
                                  fill="#ffffff"
                                  fontSize="8.5"
                                  fontWeight="700"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                                >
                                  {member.user.fullName.split(' ')[0]}
                                  {isAssigned ? ` (#${member.slotNumber})` : ''}
                                </text>
                              </g>
                            );
                          })}
                          <circle cx="100" cy="100" r="22" fill="#0f172a" stroke="#ffffff" strokeWidth="3" />
                          <text x="100" y="101" fill="#34d399" fontSize="7" fontWeight="800" textAnchor="middle" dominantBaseline="middle">
                            SUSU
                          </text>
                        </svg>
                      </div>

                      {recentWinner && (
                        <div className="w-full mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-center gap-2 text-xs font-semibold">
                          <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            {recentWinner.name} will collect first (Slot #{recentWinner.slot})!
                          </span>
                        </div>
                      )}

                      {circle.status === 'FORMING' && organizer && (
                        <button
                          onClick={handleDraw}
                          disabled={busy || members.length !== totalCycles}
                          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition cursor-pointer"
                        >
                          {isSpinning
                            ? 'Spinning Wheel...'
                            : members.length !== totalCycles
                              ? `Waiting for ${totalCycles - members.length} more member(s)`
                              : 'Spin to Assign Payout Order'}
                        </button>
                      )}
                      {circle.status === 'FORMING' && !organizer && (
                        <div className="w-full p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                          Waiting for the organizer to spin the payout wheel.
                        </div>
                      )}
                      {circle.status !== 'FORMING' && (
                        <div className="w-full p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                          All {totalCycles} payout slots are assigned. Members can trade with mutual consent below.
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-slate-900">Official Payout Rotation Schedule</h3>
                            <p className="text-xs text-slate-500">
                              {circle.fairValueSlots
                                ? 'Includes 2% Fair-Value Slot adjustment between early and anchor positions.'
                                : 'Standard equal pot distribution across all slots.'}
                            </p>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <th className="py-3 px-4">Slot</th>
                                <th className="py-3 px-4">Member</th>
                                <th className="py-3 px-4">Payout Date</th>
                                <th className="py-3 px-4">Net Payout</th>
                                <th className="py-3 px-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                              {Array.from({ length: totalCycles }, (_, i) => {
                                const m = sortedBySlot[i];
                                const assigned = m?.slotNumber === i + 1;
                                const net = getNetPayoutForSlot(i + 1);
                                const status = assigned ? (m as any).payoutStatus : 'Unassigned';
                                return (
                                  <tr key={i} className={status === 'Up Next' ? 'bg-emerald-50/40' : 'hover:bg-slate-50/70'}>
                                    <td className="py-3.5 px-4 font-bold text-slate-900">{`#${i + 1}`}</td>
                                    <td className="py-3.5 px-4">
                                      {assigned ? (
                                        <>
                                          <div className="font-semibold text-slate-900">{m!.user.fullName}</div>
                                          <div className="text-xs text-slate-500">Trust {m!.user.susuTrustScore}/100</div>
                                        </>
                                      ) : (
                                        <span className="text-slate-400 text-xs">Unassigned</span>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                                      {assigned ? fmtDate((m as any).payoutDate) : 'TBD'}
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <div className="font-bold text-slate-900">${net.amount.toLocaleString()}</div>
                                      {net.badge && <div className="text-[10px] font-medium text-slate-500">{net.badge}</div>}
                                    </td>
                                    <td className="py-3.5 px-4">
                                      {status === 'Paid Out' && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid Out
                                        </span>
                                      )}
                                      {status === 'Up Next' && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Up Next</span>
                                      )}
                                      {status === 'Upcoming' && (
                                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700">Upcoming</span>
                                      )}
                                      {status === 'Unassigned' && (
                                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700">Needs Spin</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                          <h3 className="font-bold text-slate-900 text-sm">Peer Slot Swap (Mutual Trade)</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Two members with upcoming slots can trade positions anytime with mutual consent.
                        </p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <select
                            value={swapA}
                            onChange={(e) => setSwapA(e.target.value)}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">Select Member A...</option>
                            {members
                              .filter((m) => m.userId === viewerId && m.slotNumber && m.slotNumber > circle.currentCycle)
                              .map((m) => (
                                <option key={m.id} value={m.slotNumber ?? ''}>
                                  Slot #{m.slotNumber} — {m.user.fullName}
                                </option>
                              ))}
                          </select>
                          <select
                            value={swapB}
                            onChange={(e) => setSwapB(e.target.value)}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">Select Member B...</option>
                            {members
                              .filter((m) => m.userId !== viewerId && m.slotNumber && m.slotNumber > circle.currentCycle)
                              .map((m) => (
                                <option key={m.id} value={m.slotNumber ?? ''}>
                                  Slot #{m.slotNumber} — {m.user.fullName}
                                </option>
                              ))}
                          </select>
                          <button
                            disabled={!swapA || !swapB || swapA === swapB || busy}
                            className="rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold text-xs py-2 px-4 transition cursor-pointer"
                            onClick={async () => {
                              const targetMember = members.find((m) => m.slotNumber === Number(swapB));
                              if (!targetMember) return;
                              await act('swaps', { targetUserId: targetMember.userId });
                              setSwapA('');
                              setSwapB('');
                            }}
                          >
                            Request Swap
                          </button>
                        </div>

                        <h4 className="font-bold text-slate-700 text-xs mt-6 mb-2">Pending requests</h4>
                        {circle.swaps.filter((s) => s.status === 'PENDING').length === 0 ? (
                          <p className="text-sm text-slate-500">No pending requests.</p>
                        ) : (
                          circle.swaps
                            .filter((s) => s.status === 'PENDING')
                            .map((s) => {
                              const a = members.find((m) => m.userId === s.requesterId);
                              const b = members.find((m) => m.userId === s.targetId);
                              return (
                                <div key={s.id} className="border-t py-3 text-sm">
                                  <p>
                                    {a?.user.fullName} ↔ {b?.user.fullName}
                                  </p>
                                  {s.targetId === viewerId && (
                                    <button className="btn mt-2 text-sm" disabled={busy} onClick={() => act(`swaps/${s.id}/accept`)}>
                                      Accept swap
                                    </button>
                                  )}
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section id="ledger" className="scroll-mt-24">
                  <div className="space-y-6">
                    <div
                      className={`rounded-2xl border p-5 sm:p-6 transition ${
                        allPaid && !isRotationComplete ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${allPaid && !isRotationComplete ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                              Cycle {circle.currentCycle} of {totalCycles}
                            </span>
                            <span className={`text-xs font-medium ${allPaid && !isRotationComplete ? 'text-emerald-100' : 'text-slate-500'}`}>
                              {verifiedCount} of {totalCycles} Contributions Verified
                            </span>
                          </div>
                          <h2 className="text-xl font-bold mt-1.5">
                            {isRotationComplete
                              ? 'All Cycles Completed & Disbursed'
                              : allPaid
                                ? `100% Funded! Ready to record the ${currentRecipient ? getNetPayoutForSlot(currentRecipient.slotNumber).amount.toLocaleString() : totalPot.toLocaleString()} payout`
                                : `Collecting $${totalPot.toLocaleString()} Pot for ${currentRecipient ? currentRecipient.user.fullName : 'Cycle Recipient'}`}
                          </h2>
                          <p className={`text-xs mt-1 ${allPaid && !isRotationComplete ? 'text-emerald-50' : 'text-slate-500'}`}>
                            {isRotationComplete
                              ? 'Every member has contributed and collected their full lump sum.'
                              : 'Confirmed external payments only — the platform never holds or moves money.'}
                          </p>
                        </div>

                        {organizer && !isRotationComplete && (
                          <div className="shrink-0 flex flex-col gap-2">
                            <input
                              className="field"
                              placeholder="Confirmed external payout reference"
                              value={payoutRef}
                              onChange={(e) => setPayoutRef(e.target.value)}
                            />
                            <button
                              onClick={async () => {
                                if (confirm(`Confirm the payout was sent outside SusuFlow to ${currentRecipient?.user.fullName || 'recipient'} for the current pot?`)) {
                                  await act('disburse', { externalTxRef: payoutRef });
                                  setPayoutRef('');
                                }
                              }}
                              disabled={!allPaid || payoutRef.trim().length < 3 || busy}
                              className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                                allPaid ? 'bg-slate-950 hover:bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <Wallet className="w-4 h-4 text-emerald-400" />
                              Confirm External Payout
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {ownContribution?.status === 'PENDING' && (
                      <div className="card">
                        {circle.mode === 'AUTOMATED_SIMULATED' ? (
                          <>
                            <h2 className="font-bold text-xl">Simulate ACH contribution</h2>
                            <p className="text-sm text-slate-500 my-3">Test-only transaction. No money will be debited or moved.</p>
                            <button disabled={busy} className="btn" onClick={() => act('simulate')}>
                              Simulate ACH payment
                            </button>
                          </>
                        ) : (
                          <>
                            <h2 className="font-bold text-xl">Submit payment reference</h2>
                            <p className="text-sm text-slate-500 my-3">
                              Pay your organizer outside SusuFlow first, then submit the confirmation reference and
                              optionally attach a screenshot or receipt.
                            </p>
                            <div className="flex flex-wrap gap-3">
                              <select className="field flex-1" value={method} onChange={(e) => setMethod(e.target.value)}>
                                {['ZELLE', 'VENMO', 'CASHAPP', 'ACH', 'CASH', 'OTHER'].map((m) => (
                                  <option key={m}>{m}</option>
                                ))}
                              </select>
                              <input
                                className="field flex-[2]"
                                placeholder="External transaction reference"
                                value={txRef}
                                onChange={(e) => setTxRef(e.target.value)}
                              />
                            </div>
                            <div className="mt-3">
                              <input
                                type="file"
                                className="text-sm text-slate-600"
                                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                                onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                Optional receipt (image or PDF, max 5 MB). Stored privately; only you and the organizer can view it.
                              </p>
                            </div>
                            <button
                              className="btn mt-3"
                              disabled={busy || txRef.trim().length < 3}
                              onClick={submitWithEvidence}
                            >
                              {uploading ? 'Submitting & uploading…' : 'Submit proof'}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900">Cycle {circle.currentCycle} Contribution Ledger</h3>
                        <p className="text-xs text-slate-500">Due {activeCycle ? fmtDate(activeCycle.dueDate) : '—'} · recipient {currentRecipient?.user.fullName ?? 'Not yet assigned'}</p>
                      </div>
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="p-3">Member</th>
                              <th className="p-3">Rail / Ref</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {members.map((m, idx) => {
                              const c = contribByUser.get(m.userId);
                              return (
                                <tr key={m.id} className="border-t">
                                  <td className="p-3 font-semibold">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-6 h-6 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} text-white text-[10px] font-bold flex items-center justify-center`}>
                                        {initials(m.user.fullName)}
                                      </span>
                                      {m.user.fullName}
                                    </div>
                                  </td>
                                  <td className="p-3 text-xs">
                                    <div className="font-semibold text-slate-800">{m.paymentMethod}</div>
                                    <div className="text-slate-400 font-mono">{m.txRef || 'Awaiting transfer'}</div>
                                    {(organizer || m.userId === viewerId) && c?.evidence && c.evidence.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {c.evidence.map((e) => (
                                          <a
                                            key={e.id}
                                            href={`/api/circles/${circle.id}/evidence/${e.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-emerald-700 underline text-[11px]"
                                          >
                                            📎 {e.fileName}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 font-bold">${contribution.toLocaleString()}</td>
                                  <td className="p-3">
                                    <span className={`pill ${c?.status === 'VERIFIED' ? '' : '!bg-amber-50 !text-amber-800'}`}>{m.currentCycleStatus}</span>
                                  </td>
                                  <td className="p-3">{renderLedgerActions(m, c)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile contribution ledger cards */}
                      <div className="sm:hidden divide-y divide-slate-100">
                        {members.map((m, idx) => {
                          const c = contribByUser.get(m.userId);
                          return (
                            <div key={m.id} className="p-4 space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className={`w-9 h-9 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                                    {initials(m.user.fullName)}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{m.user.fullName}</p>
                                    <p className="text-xs text-slate-500">{m.paymentMethod}</p>
                                  </div>
                                </div>
                                <span className={`pill ${c?.status === 'VERIFIED' ? '' : '!bg-amber-50 !text-amber-800'} shrink-0`}>{m.currentCycleStatus}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-xs text-slate-400 font-mono break-all min-w-0">{m.txRef || 'Awaiting transfer'}</span>
                                <span className="font-bold text-slate-900 shrink-0">${contribution.toLocaleString()}</span>
                              </div>
                              {(organizer || m.userId === viewerId) && c?.evidence && c.evidence.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {c.evidence.map((e) => (
                                    <a
                                      key={e.id}
                                      href={`/api/circles/${circle.id}/evidence/${e.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-700 underline text-[11px]"
                                    >
                                      📎 {e.fileName}
                                    </a>
                                  ))}
                                </div>
                              )}
                              {renderLedgerActions(m, c)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                <section id="audit" className="scroll-mt-24">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">Transparent Circle Audit Ledger</h3>
                        <p className="text-xs text-slate-500">Chronological record of verified contributions, wheel spins, slot swaps, and disbursements.</p>
                      </div>
                      <Link href="/admin/audit" className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">
                        Organizer trail →
                      </Link>
                    </div>
                    <div className="p-8 text-center text-sm text-slate-500">
                      Full audit history is available on the{' '}
                      <Link href="/admin/audit" className="text-emerald-700 font-semibold">
                        organizer audit page
                      </Link>
                      .
                    </div>
                  </div>
                </section>
              </div>
            </section>

            <p className="px-5 sm:px-8 pb-6">
              <div className="max-w-6xl mx-auto text-xs text-slate-500 flex gap-2 items-center">
                <ShieldCheck size={14} />
                Beta notice: SusuFlow is a coordination ledger, not a bank, escrow service, or money transmitter. Do not treat submitted proof as cleared money.
              </div>
            </p>
          </>
        )}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 flex items-stretch shadow-[0_-4px_12px_rgba(15,23,42,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        {[
          { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
          { id: 'wheel' as const, label: 'Wheel', icon: CircleDot },
          { id: 'ledger' as const, label: 'Ledger', icon: FileCheck },
          { id: 'audit' as const, label: 'Audit', icon: History },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          const dot = item.id === 'wheel' && unassignedCount > 0;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 relative flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${
                active ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="relative">
                <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : ''}`} />
                {dot && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" />}
              </span>
              {item.label}
            </button>
          );
        })}
        <button
          onClick={() => setShowMobileMenu((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={showMobileMenu}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition"
        >
          <MoreHorizontal className="w-5 h-5" />
          More
        </button>
      </nav>

      {/* MOBILE ACCOUNT MENU */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-[85]">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setShowMobileMenu(false)} aria-hidden="true" />
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl border-t border-slate-200 shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            role="menu"
            aria-label="Account menu"
          >
            <div className="p-2 pt-3">
              <div className="mx-auto mb-2 w-10 h-1 rounded-full bg-slate-200" aria-hidden="true" />
              <Link
                href="/profile"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <UserRound className="w-5 h-5 text-slate-500" />
                Profile
              </Link>
              <Link
                href="/admin/audit"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <History className="w-5 h-5 text-slate-500" />
                Organizer Audit
              </Link>
<ReportBugButton className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 text-left">
                <Bug className="w-5 h-5 text-slate-500" />
                Report a bug
              </ReportBugButton>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base">Launch a New Susu Circle</h2>
                  <p className="text-xs text-slate-400">Configure pot rules and invite members after creation</p>
                </div>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Circle Name *</label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={80}
                    placeholder="e.g., Family & Friends Savings"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contribution ($) *</label>
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    step="0.01"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contribution Schedule</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Members / cycles *</label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={newTotalCycles}
                    onChange={(e) => setNewTotalCycles(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First cycle due date</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Collection & Verification Rail</label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="LEDGER">Ledger Mode (Zelle / Venmo / Cash)</option>
                    <option value="AUTOMATED_SIMULATED">Automated ACH Mode (Simulation Only)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Enable Fair-Value Slot Incentives</span>
                  </div>
                  <p className="text-xs text-emerald-900/80 mt-0.5 leading-relaxed">
                    Early recipients (Slots 1 & 2) contribute a 2% convenience fee paid as a bonus to the final anchor slots.
                  </p>
                </div>
                <input type="checkbox" checked={newFairValue} onChange={(e) => setNewFairValue(e.target.checked)} className="mt-1 w-4 h-4 accent-emerald-600 rounded cursor-pointer" />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Estimated Lump-Sum Pot Size:</span>
                <span className="text-base font-bold text-slate-900">
                  ${((Number(newAmount) || 0) * (Number(newTotalCycles) || 0)).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">every {FREQ_LABEL[newFrequency]?.toLowerCase()} cycle</span>
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition cursor-pointer">
                  Create Circle & Generate Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
