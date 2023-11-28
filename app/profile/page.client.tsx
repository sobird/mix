'use client';

import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
// import { cache, use } from 'react';

export default function Profile() {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/api/auth/signin');
    },
  });

  if (status === 'loading') {
    return <p>Loading....</p>;
  }

  return (
    <div>
      {JSON.stringify(status)}
    </div>
  );
}
