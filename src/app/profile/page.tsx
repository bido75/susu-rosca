import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Users, Wallet, BellRing } from 'lucide-react';
import KycRequest from '@/components/KycRequest';
import PayoutMethodsManager from '@/components/PayoutMethodsManager';
import PushNotifications from '@/components/PushNotifications';

export const dynamic = 'force-dynamic';

export default async function Profile() {
  const user = await currentUser();
  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-8">
        <Link href="/circles" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700 mb-6">
          <ArrowLeft size={16} /> Back to circles
        </Link>
        <div className="card">
          <Link className="btn" href="/login">Sign in</Link>
        </div>
      </div>
    );
  }

  const circles = await db.circle.findMany({
    where: { members: { some: { userId: user.id } } },
    select: { id: true, name: true, status: true, contributionAmount: true, frequency: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-8 space-y-5">
      <Link href="/circles" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700">
        <ArrowLeft size={16} /> Back to circles
      </Link>

      <div className="card space-y-4">
        <ShieldCheck size={42} className="text-emerald-600" />
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="font-bold">{user.fullName}</p>
        <p className="text-slate-500">{user.email}</p>
        {user.phoneNumber && <p className="text-slate-500">{user.phoneNumber}</p>}
        {user.isAdmin && <p className="text-xs font-semibold text-indigo-600">Administrator</p>}
        <div className="rounded-xl bg-emerald-50 p-5">
          <p className="text-sm font-bold text-emerald-700">Susu Trust Score</p>
          <p className="text-4xl font-extrabold">{user.susuTrustScore}</p>
          <p className="text-xs text-slate-600 mt-2">Earn +1 for each timely verified cycle contribution. Community activity metric, not a credit score.</p>
        </div>
        <div className="flex items-center justify-between">
          <span>KYC: {user.kycStatus}</span>
          <KycRequest status={user.kycStatus} />
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="btn-secondary">Sign out</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-bold flex items-center gap-2">
          <Wallet size={18} /> My Payout Methods
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Choose how you want to receive your Susu payout. Your identifiers are protected and only shown to members who need to pay you.
        </p>
        <div className="mt-3">
          <PayoutMethodsManager />
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold flex items-center gap-2">
          <BellRing size={18} /> Notifications
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Get alerted on your device when a payout is coming up, when instructions change, or when a cash handoff needs you.
        </p>
        <div className="mt-3">
          <PushNotifications />
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold flex items-center gap-2">
          <Users size={18} /> Your circles ({circles.length})
        </h2>
        {circles.length === 0 ? (
          <p className="text-sm text-slate-500 mt-3">You aren&apos;t in any circles yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 mt-2">
            {circles.map((c) => (
              <li key={c.id}>
                <Link href={`/circles/${c.id}`} className="flex justify-between items-center py-3 hover:text-emerald-700">
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-xs text-slate-500">${Number(c.contributionAmount).toLocaleString()} · {c.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}