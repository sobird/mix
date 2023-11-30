import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <div>
      {JSON.stringify(session)}
    </div>
  );
}