import { NextRequest, NextResponse } from 'next/server';

import { sleep } from '@/utils';

export const GET = async (req: NextRequest) => {
  await sleep(1000);
  return NextResponse.json({ url: req.url });
};
