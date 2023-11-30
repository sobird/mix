import React from 'react';
import { Input, Button, ConfigProvider } from 'antd';

interface SigninFormProps {
  csrfToken?: string;
}

const SigninForm: React.FC<SigninFormProps> = ({ csrfToken }) => {
  return (
    <ConfigProvider componentSize="large">
      <form method="post" action="/api/auth/signin/email">
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        <Input id="email" name="email" placeholder="输入电子邮箱" style={{ marginBottom: 30 }} />
        <div>
          <Button type="primary" style={{ width: '100%' }} htmlType="submit">发送登录连接</Button>
        </div>
      </form>
    </ConfigProvider>
  );
};

export default SigninForm;
