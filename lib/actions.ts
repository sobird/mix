'use server';

import { UserModel } from '@/models';

export const submitAbout = async (...args) => {
  console.log('data');
  console.log('UserModel', UserModel);
  // return NextResponse.json({ message: 'ok' });
};
