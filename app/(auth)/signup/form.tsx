'use client';

import { signIn } from 'next-auth/react';
import { ChangeEvent, useState } from 'react';
import {
  Input, Button, Form, ConfigProvider,
} from 'antd';

export const SignupForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(formValues),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setLoading(false);
      if (!res.ok) {
        alert((await res.json()).message);
        return;
      }

      signIn(undefined, { callbackUrl: '/' });
    } catch (error: any) {
      setLoading(false);
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <ConfigProvider componentSize="large">
      <Form
        form={form}
        onFinish={onSubmit}
      >
        <Form.Item name="username">
          <Input placeholder="请输入用户名称" />
        </Form.Item>
        <Form.Item name="password">
          <Input.Password placeholder="请输入用户密码" />
        </Form.Item>
        <Form.Item name="password2">
          <Input.Password placeholder="请输入确认密码" />
        </Form.Item>
        <Form.Item name="email">
          <Input placeholder="请输入用户邮箱" />
        </Form.Item>

        <Button
          type="primary"
          disabled={loading}
        >
          注册
        </Button>
      </Form>
    </ConfigProvider>
  );
};
