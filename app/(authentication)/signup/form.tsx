/**
 * 用户注册表单
 *
 * sobird<i@sobird.me> at 2023/11/28 15:53:54 created.
 */

'use client';

import {
  Input, Button, Form, ConfigProvider,
} from 'antd';
import { signUpAction } from '@/actions/user';
import {
  usernameRule, passwordRule, emailRule, verificationCodeRule,
} from '@/zod/user';
import FieldCaptcha from '@/components/field-captcha';
import useServerAction from '@/hooks/useServerAction';
import { ActionStatus } from '@/actions';

export const SignupForm = () => {
  const initialState: ServerActionState = {
    status: ActionStatus.INITIAL,
    message: 'initial state',
  };
  const [form] = Form.useForm();
  const [, dispatch, pending] = useServerAction(signUpAction, initialState);
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
          rules={[usernameRule]}
        >
          <Input placeholder="用户名" />
        </Form.Item>
        <Form.Item name="password" rules={[passwordRule]}>
          <Input.Password placeholder="登录密码" />
        </Form.Item>
        <Form.Item name="confirmPassword" dependencies={['password']} rules={[passwordRule]}>
          <Input.Password placeholder="密码确认" />
        </Form.Item>
        <Form.Item name="email" validateDebounce={300} rules={[emailRule]}>
          <Input placeholder="邮箱" />
        </Form.Item>
        <Form.Item name="verificationCode" validateDebounce={300} rules={[verificationCodeRule]}>
          <FieldCaptcha identifierName="email" fieldProps={{ placeholder: '请输入邮箱验证码' }} />
        </Form.Item>

        <Button
          type="primary"
          disabled={pending}
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
