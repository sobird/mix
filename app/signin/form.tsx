'use client';

import React from 'react';
import { Button } from 'antd';
import styles from './page.module.scss';

interface SigninFormProps {
  csrfToken?: string;
}

const SigninForm: React.FC<SigninFormProps> = ({ csrfToken }) => {
  return (
    <form method="post" action="/api/auth/signin/email">
      <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
      <input type="email" id="email" name="email" placeholder="请输入您的邮箱" />
      <Button type="primary">使用邮箱登录</Button>
    </form>
  );
};

export default SigninForm;
