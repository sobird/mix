'use client';

import React from 'react';
import {
  Form, Input,
} from 'antd';
import { CreateUserFormRule, UserPasswordRule } from '@/zod/user';
import withActionForm from '@/components/with-action-form';

const RoleForm: React.FC = () => {
  return (
    <>
      <Form.Item
        name="username"
        validateDebounce={300}
        rules={[CreateUserFormRule]}
      >
        <Input placeholder="用户名" />
      </Form.Item>
      <Form.Item name="password" rules={[UserPasswordRule]}>
        <Input.Password placeholder="登录密码" />
      </Form.Item>
      <Form.Item name="confirmPassword" dependencies={['password']} rules={[UserPasswordRule]}>
        <Input.Password placeholder="密码确认" />
      </Form.Item>
      <Form.Item name="email" validateDebounce={300} rules={[CreateUserFormRule]}>
        <Input placeholder="邮箱" />
      </Form.Item>
    </>
  );
};

export default withActionForm(RoleForm);
