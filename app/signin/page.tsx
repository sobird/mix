import { getCsrfToken } from 'next-auth/react';
import { CtxOrReq } from 'next-auth/client/_utils';
import styles from './page.module.scss';
import SigninForm from './form';

const SigninPage = async (ctx: CtxOrReq) => {
  const csrfToken = await getCsrfToken(ctx);

  return (
    <div className={styles.signin}>
      <SigninForm csrfToken={csrfToken} />
    </div>
  );
};

export default SigninPage;
