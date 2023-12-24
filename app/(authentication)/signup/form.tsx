/**
 * 用户注册表单
 *
 * sobird<i@sobird.me> at 2023/11/28 15:53:54 created.
 */

'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import {
  Input, Button, Form, ConfigProvider,
} from 'antd';
import { signup } from '@/actions/auth';
import { SignUpFormRule, SignUpPasswordRule } from '@/zod/user';
import FieldCaptcha from '@/components/field-captcha';

const initialState: ServerActionState = {
  success: true,
  message: 'ok',
};

export const SignupForm = () => {
  const [form] = Form.useForm();
  const [state, dispatch] = useFormState(signup, initialState);

  useEffect(() => {
    console.log('state', state);
  }, [state?.success]);
  return (
    <ConfigProvider componentSize="large">
      <Form
        form={form}
        onFinish={(values) => {
          dispatch(values);
        }}
      >
        <Form.Item
          name="username"
          validateDebounce={300}
          rules={[SignUpFormRule]}
        >
          <Input placeholder="用户名" />
        </Form.Item>
        <Form.Item name="password" rules={[SignUpPasswordRule]}>
          <Input.Password placeholder="登录密码" />
        </Form.Item>
        <Form.Item name="confirmPassword" dependencies={['password']} rules={[SignUpPasswordRule]}>
          <Input.Password placeholder="密码确认" />
        </Form.Item>
        <Form.Item name="email" validateDebounce={300} rules={[SignUpFormRule]}>
          <Input placeholder="邮箱" />
        </Form.Item>
        <Form.Item name="verificationCode" rules={[SignUpFormRule]}>
          <FieldCaptcha identifierName="email" fieldProps={{ placeholder: '请输入邮箱验证码' }} />
        </Form.Item>

        <Button
          type="primary"
          style={{ width: '100%', borderColor: 'transparent' }}
          // htmlType="submit"
          onClick={() => {
            form.submit();
          }}
        >
          立即注册
        </Button>
      </Form>
    </ConfigProvider>
  );
};
