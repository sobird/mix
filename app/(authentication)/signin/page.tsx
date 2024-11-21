/**
 * Sign In Page
 *
 * @see https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/lib/pages/signin.tsx
 *
 * sobird<i@sobird.me> at 2023/11/28 14:26:38 created.
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getCsrfToken } from 'next-auth/react';

import { getCsrfAuthToken } from '@/services/auth';

import SigninForm from './form';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: '登录',
};

const SigninPage = async () => {
  const ck = await cookies();
  console.log('ck', ck);
  // https://github.com/nextauthjs/next-auth/discussions/7256
  const csrfToken = await getCsrfToken({
    req: {
      headers: {
        cookie: ck.toString(),
      },
    },
  });

  const csrfToken2 = await getCsrfToken();

  return (
    <div className="auth-form">
      <h1>登录</h1>
      <p>{csrfToken}</p>
      <p>{csrfToken2}</p>
      <p>{await getCsrfAuthToken()}</p>
      <SigninForm />
    </div>
  );
};

export default SigninPage;
