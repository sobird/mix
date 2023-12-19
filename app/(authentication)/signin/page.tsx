import { Metadata } from 'next';
import SigninForm from './form';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: '登录',
};

const SigninPage = async () => {
  // https://github.com/nextauthjs/next-auth/discussions/7256
  // const csrfToken = await getCsrfToken({
  //   req: {
  //     headers: {
  //       cookie: cookies().toString(),
  //     },
  //   },
  // });

  return (
    <div className="auth-form">
      <h1>登录</h1>
      <SigninForm />
    </div>
  );
};

export default SigninPage;
