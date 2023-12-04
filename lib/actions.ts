'use server';

import { NextResponse } from 'next/server';

export const submitAbout = async (...args) => {
  console.log('data');

  return NextResponse.json({ message: 'ok' });
};
