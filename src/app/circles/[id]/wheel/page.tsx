import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CircleWorkspace from '@/components/CircleWorkspace';

export const dynamic = 'force-dynamic';

export default async function Wheel({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect('/login');
  const { id } = await params;
  return <CircleWorkspace id={id} section="wheel" />;
}