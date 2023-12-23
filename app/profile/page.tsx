import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';

export default async function Profile() {
  const session = await getServerAuthSession();
  console.log('session', session);
  if (!session) {
    // redirect('/api/auth/signin');
  }

  return (
    <div>
      {JSON.stringify(session)}
    </div>
  );
}
