import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Audit() {
  const user = await currentUser();
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <Link href="/circles" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700">
          <ArrowLeft size={16} /> Back to circles
        </Link>
        <div className="card mt-6">
          <Link href="/login" className="btn">Sign in</Link>
        </div>
      </div>
    );
  }

  const orgCircleIds = (await db.circle.findMany({ where: { createdBy: user.id }, select: { id: true } })).map((c) => c.id);
  const logs = await db.auditLog.findMany({
    where: { circleId: { in: orgCircleIds } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { actor: { select: { fullName: true } } },
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-5">
      <Link href="/circles" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700">
        <ArrowLeft size={16} /> Back to circles
      </Link>
      <h1 className="text-3xl font-extrabold">Organizer Audit Trail</h1>
      <p className="text-slate-500">Critical recorded events for circles you organize. Entries are append-only at database level.</p>
      <div className="card overflow-x-auto">
        <table className="text-sm w-full">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="p-3">Time</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Reference</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr className="border-t" key={l.id}>
                <td className="p-3 whitespace-nowrap">{l.createdAt.toLocaleString()}</td>
                <td className="p-3">{l.actor.fullName}</td>
                <td className="p-3 font-semibold">{l.action}</td>
                <td className="p-3 text-xs break-all">{l.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length && <p className="p-3 text-slate-500">No events yet.</p>}
      </div>
    </div>
  );
}
