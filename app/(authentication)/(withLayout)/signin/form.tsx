'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Form, Input, Button, ConfigProvider, message,
} from 'antd';
import { isEmail } from '@/utils/validator';

const SigninForm: React.FC = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const onFinish = async ({ email }) => {
    setLoading(true);
    const res = await signIn('email', { email, redirect: false });
    setLoading(false);
    if (res?.error) {
      message.error(res.error);
      return;
    }
    if (res?.ok) {
      router.push(`/signin/verify?email=${email}`, {
        scroll: false,
      });
    }
  };
  return (
    <ConfigProvider componentSize="large">
      <Form form={form} onFinish={onFinish}>
        <Form.Item
          name="email"
          rules={[{
            async validator(rule, value) {
              if (isEmail(value)) {
                setDisabled(false);
              } else {
                setDisabled(true);
              }
            },
          }]}
        >
          <Input
            placeholder="输入电子邮箱"
            allowClear
          />
        </Form.Item>

        <div>
          <Button
            loading={loading}
            disabled={disabled}
            type="primary"
            style={{ width: '100%', borderColor: 'transparent' }}
            htmlType="submit"
          >
            发送登录连接
          </Button>
        </div>
      </Form>
    </ConfigProvider>
  );
};

export default SigninForm;
