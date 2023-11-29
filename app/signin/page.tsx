import { getProviders, getCsrfToken } from 'next-auth/react';
import { Button } from 'antd';

const SigninPage = async (ctx) => {
  // const providers = await getProviders();
  // const csrfToken = await getCsrfToken(ctx);

  // console.log('csrfToken', csrfToken);
  return (
    <Button>
      登录

    </Button>
  );
};

export default SigninPage;
