'use client';

import {
  Form, Input, Button, ConfigProvider, message, Tabs, type TabsProps,
} from 'antd';
import { useRouter } from 'next/navigation';
import { signIn, getCsrfToken } from 'next-auth/react';
import React, { useState } from 'react';

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
      console.log('res', res);
      router.push(`/signin/verify?email=${email}`, {
        scroll: false,
      });
    }
  };

  return (
    <ConfigProvider componentSize="large">
      <Form form={form} onFinish={onFinish}>
        <Tabs size="middle">
          <Tabs.TabPane tab="账号登录" key="account">
            <Form.Item
              name="username"
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
              <Input placeholder="用户账号" allowClear />
            </Form.Item>

            <Form.Item name="password">
              <Input.Password placeholder="用户密码" allowClear />
            </Form.Item>

            <div>
              <Button
                loading={loading}
                disabled={disabled}
                type="primary"
                style={{ width: '100%', borderColor: 'transparent' }}
                htmlType="submit"
              >
                登录
              </Button>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab="邮箱登录" key="email">
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
              <Input placeholder="输入电子邮箱" allowClear />
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
          </Tabs.TabPane>
        </Tabs>

      </Form>
      {/* <Link href="/signup">注册</Link> */}
    </ConfigProvider>
  );
};

export default SigninForm;
