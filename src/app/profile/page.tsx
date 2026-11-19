import { currentUser } from '@/lib/auth';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Profile() {
  const user = await currentUser();
  return (
    <div className="max-w-xl mx-auto p-4 sm:p-8">
      <Link href="/circles" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700 mb-6">
        <ArrowLeft size={16} /> Back to circles
      </Link>
      {!user ? (
        <div className="card">
          <Link className="btn" href="/login">Sign in</Link>
        </div>
      ) : (
        <div className="card space-y-4">
          <ShieldCheck size={42} className="text-emerald-600" />
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="font-bold">{user.fullName}</p>
          <p className="text-slate-500">{user.email}</p>
          <div className="rounded-xl bg-emerald-50 p-5">
            <p className="text-sm font-bold text-emerald-700">Susu Trust Score</p>
            <p className="text-4xl font-extrabold">{user.susuTrustScore}</p>
            <p className="text-xs text-slate-600 mt-2">Earn +1 for each timely verified cycle contribution. Community activity metric, not a credit score.</p>
          </div>
          <p>KYC: {user.kycStatus}</p>
          <form action="/api/auth/logout" method="post">
            <button className="btn-secondary">Sign out</button>
          </form>
        </div>
      )}
    </div>
  );
}
