/**
 * 用户注册表单
 *
 * sobird<i@sobird.me> at 2023/11/28 15:53:54 created.
 */

'use client';

import { Alert, Button, ConfigProvider, Form, Input } from 'antd';
import { useEffect } from 'react';

import { ActionStatus } from '@/actions';
import { signUpAction } from '@/actions/user';
import FieldCaptcha from '@/components/field-captcha';
import useServerAction from '@/hooks/useServerAction';
import { usernameRule, passwordRule, emailRule, verificationCodeRule } from '@/zod/user';

const initialState: ServerActionState = {
  status: ActionStatus.INITIAL,
};

export const SignupForm = () => {
  const [form] = Form.useForm();
  const [state, dispatch, pending] = useServerAction(signUpAction, initialState);

  // 服务端校验失败时把字段错误回填到对应表单项
  useEffect(() => {
    if (!state?.errors) {
      return;
    }

    const fields = Object.entries(state.errors as Record<string, string | string[]>).flatMap(([name, value]) => {
      const errors = (Array.isArray(value) ? value : [value]).filter(Boolean);

      return errors.length > 0 ? [{ name, errors }] : [];
    });

    form.setFields(fields);
  }, [state, form]);

  return (
    <ConfigProvider componentSize="large">
      <Form form={form} onFinish={(values) => dispatch(values)}>
        <Form.Item name="username" validateDebounce={300} rules={[usernameRule]}>
          <Input placeholder="用户名" autoComplete="username" />
        </Form.Item>
        <Form.Item name="password" rules={[passwordRule]}>
          <Input.Password placeholder="8-16位，含大小写字母、数字及符号" autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="confirmPassword" dependencies={['password']} rules={[passwordRule]}>
          <Input.Password placeholder="密码确认" autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="email" validateDebounce={300} rules={[emailRule]}>
          <Input placeholder="邮箱" autoComplete="email" />
        </Form.Item>
        <Form.Item name="verificationCode" validateDebounce={300} rules={[verificationCodeRule]}>
          <FieldCaptcha identifierName="email" fieldProps={{ placeholder: '请输入邮箱验证码' }} />
        </Form.Item>

        {state?.status === ActionStatus.FAILURE && !state.errors && state.message ? (
          <Alert type="error" title={state.message} showIcon style={{ marginBottom: 16 }} />
        ) : null}

        <Button
          type="primary"
          htmlType="submit"
          loading={pending}
          style={{ width: '100%', borderColor: 'transparent' }}
        >
          立即注册
        </Button>
      </Form>
    </ConfigProvider>
  );
};
