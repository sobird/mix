import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { getCsrfToken } from 'next-auth/react';
// import { CtxOrReq } from 'next-auth/client/_utils';
import styles from './page.module.scss';
import SigninForm from './form';
import { authOptions } from '@/lib/auth';

const SigninPage = async () => {
  // https://github.com/nextauthjs/next-auth/discussions/7256
  const csrfToken = await getCsrfToken({
    req: {
      headers: {
        cookie: cookies().toString(),
      },
    },
  });
  const session = await getServerSession(authOptions);

  console.log('session', session);

  return (
    <div className={styles.signin}>
      <SigninForm csrfToken={csrfToken} />
    </div>
  );
};

export default SigninPage;
