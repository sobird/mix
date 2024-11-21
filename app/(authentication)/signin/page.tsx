/**
 * SignIn Page
 *
 * @see https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/lib/pages/signin.tsx
 *
 * sobird<i@sobird.me> at 2023/11/28 14:26:38 created.
 */

import { Divider, Typography } from 'antd';
import { Metadata } from 'next';
import Link from 'next/link';
import { getProviders } from 'next-auth/react';

import Providers from '@/components/providers';

import SigninForm from './form';

export const metadata: Metadata = {
  title: '欢迎登录',
};

interface SearchParams {
  callbackUrl: string;
}

const SigninPage: AppPage<{}, SearchParams> = async ({ searchParams }) => {
  const { callbackUrl } = await searchParams;

  return (
    <>
      <h1>欢迎登录</h1>
      <div className='account-container'>
        <SigninForm callbackUrl={callbackUrl} />

        <Typography>
          还没有账号？
          <Link href="/signup">立即注册</Link>
        </Typography>
        <Divider plain>其他登录方式</Divider>

        <Providers callbackUrl={callbackUrl} />
      </div>
    </>
  );
};

export default SigninPage;
