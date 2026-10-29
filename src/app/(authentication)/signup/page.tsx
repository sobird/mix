import { Divider, Typography } from 'antd';
import classNames from 'classnames';
import { Metadata } from 'next';
import Link from 'next/link';

import Providers from '@/components/providers';

import { SignupForm } from './form';

import styles from './index.module.scss';

export const metadata: Metadata = {
  title: '注册账号',
};

interface SearchParams {
  callbackUrl?: string;
}

const RegisterPage: AppPage<{}, SearchParams> = async ({ searchParams }) => {
  const { callbackUrl } = await searchParams;

  return (
    <>
      <h1>注册</h1>
      <div className={classNames('account-container', styles.container)}>
        <SignupForm />

        <Typography>
          已有账号？
          <Link href="/signin">立即登录</Link>
        </Typography>

        <Divider plain>其他登录方式</Divider>

        <Providers callbackUrl={callbackUrl} />
      </div>
    </>
  );
};

export default RegisterPage;
