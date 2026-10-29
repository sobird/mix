import { NextResponse } from 'next/server';

import { sequelize } from '@/lib/sequelize';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    await sequelize.authenticate();
    return NextResponse.json({ status: 'ok', db: 'up' });
  } catch {
    return NextResponse.json({ status: 'error', db: 'down' }, { status: 503 });
  }
}
