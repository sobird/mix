import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import sequelize from '@/lib/sequelize';

console.log('sequelize', sequelize.models);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse(
      JSON.stringify({ status: 'fail', message: 'You are not logged in' }),
      { status: 401 },
    );
  }

  return NextResponse.json({
    authenticated: !!session,
    session,
  });
}
