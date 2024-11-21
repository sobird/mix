'use client';

import {
  Form, Input, Button, ConfigProvider, message, Tabs,
} from 'antd';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import React, { useState } from 'react';

import { isEmail } from '@/utils/validator';

interface SigninFormProps {
  callbackUrl?: string;
}

const SigninForm: React.FC<SigninFormProps> = ({ callbackUrl }) => {
  const [messageApi, contextHolder] = message.useMessage();

  const router = useRouter();
  const [form] = Form.useForm();
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const onCredentialsFinish = async ({ username, password }) => {
    setLoading(true);
    const res = await signIn('credentials', {
      username, password, redirect: false, callbackUrl,
    });
    setLoading(false);

    if (res?.error) {
      messageApi.error(`${res.error}, 请重试`);
      return;
    }
    if (res?.ok) {
      router.push(res.url || '', {
        scroll: false,
      });
    }
  };

  const onEmailFinish = async ({ email }) => {
    setLoading(true);
    const res = await signIn('email', { email, redirect: false, callbackUrl });
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
      {contextHolder}
      <Tabs size="middle">
        <Tabs.TabPane tab="账号登录" key="credentials">
          <Form form={form} onFinish={onCredentialsFinish}>
            <Form.Item name="username">
              <Input name="username" placeholder="用户账号" allowClear />
            </Form.Item>

            <Form.Item name="password">
              <Input.Password name="password" placeholder="用户密码" allowClear />
            </Form.Item>

            <div>
              <Button
                type="primary"
                style={{ width: '100%', borderColor: 'transparent' }}
                htmlType="submit"
              >
                登录
              </Button>
            </div>
          </Form>
        </Tabs.TabPane>
        <Tabs.TabPane tab="邮箱登录" key="email">
          <Form form={form} onFinish={onEmailFinish}>
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
              <Input name="email" placeholder="输入电子邮箱" allowClear />
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
        </Tabs.TabPane>
      </Tabs>

      {/* <Link href="/signup">注册</Link> */}
    </ConfigProvider>
  );
};

export default SigninForm;
