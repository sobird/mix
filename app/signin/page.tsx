import { Metadata } from 'next';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { getCsrfToken } from 'next-auth/react';
// import { CtxOrReq } from 'next-auth/client/_utils';
import SigninForm from './form';
import styles from './page.module.scss';
import mix from '@/assets/mix.svg';

export const metadata: Metadata = {
  title: '登录',
};

const SigninPage = async () => {
  // https://github.com/nextauthjs/next-auth/discussions/7256
  const csrfToken = await getCsrfToken({
    req: {
      headers: {
        cookie: cookies().toString(),
      },
    },
  });

  return (
    <div className={styles.signin}>
      <Image className="logo" src={mix.src} width={32} height={32} alt="mix" />
      <SigninForm csrfToken={csrfToken} />
    </div>
  );
};

export default SigninPage;
