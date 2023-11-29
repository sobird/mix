import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getCsrfToken } from 'next-auth/react';
// import { CtxOrReq } from 'next-auth/client/_utils';
import SigninForm from './form';
import styles from './page.module.scss';

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
      <SigninForm csrfToken={csrfToken} />
    </div>
  );
};

export default SigninPage;
