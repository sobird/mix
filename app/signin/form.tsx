'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Input, Button, ConfigProvider } from 'antd';
import { isEmail } from '@/utils/validator';

interface SigninFormProps {
  csrfToken?: string;
}

const SigninForm: React.FC<SigninFormProps> = ({ csrfToken }) => {
  const [disabled, setDisabled] = useState(true);
  return (
    <ConfigProvider componentSize="large">
      <form method="post" action="/api/auth/signin/email">
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        <Input
          id="email"
          name="email"
          placeholder="输入电子邮箱"
          style={{ marginBottom: 30 }}
          allowClear
          onChange={(e) => {
            const { value } = e.target;
            if (isEmail(value)) {
              setDisabled(false);
            } else {
              setDisabled(true);
            }
          }}
        />
        <div>
          <Button
            onClick={async () => {
              const res = await signIn('email', { email: 'ddd@test.com', redirect: false });
              console.log('res', res);
            }}
            disabled={disabled}
            type="primary"
            style={{ width: '100%', borderColor: 'transparent' }}
          >
            发送登录连接

          </Button>
        </div>
      </form>
    </ConfigProvider>
  );
};

export default SigninForm;
