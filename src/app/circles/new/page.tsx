import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CircleWorkspace from '@/components/CircleWorkspace';

export const dynamic = 'force-dynamic';

export default async function NewCircle() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return <CircleWorkspace openCreate />;
}