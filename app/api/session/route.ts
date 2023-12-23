import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json(
      { status: 'fail', message: 'You are not logged in' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    authenticated: !!session,
    session,
  });
}
