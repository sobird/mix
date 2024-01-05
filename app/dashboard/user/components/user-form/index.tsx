'use client';

import React from 'react';
import {
  Form, Input,
} from 'antd';
import { CreateUserFormRule, UserPasswordRule } from '@/zod/user';
import withActionForm from '@/components/with-action-form';

type UserFormProps = {
  mode: 'create' | 'edit' | 'read'
};

const UserForm: React.FC = () => {
  return (
    <>
      <Form.Item
        name="username"
        label="用户名"
        validateDebounce={300}
        rules={[CreateUserFormRule]}
        required
      >
        <Input />
      </Form.Item>
      <Form.Item label="登录密码" name="password" rules={[UserPasswordRule]}>
        <Input.Password placeholder="登录密码" />
      </Form.Item>
      <Form.Item label="密码确认" name="confirmPassword" dependencies={['password']} rules={[UserPasswordRule]}>
        <Input.Password placeholder="密码确认" />
      </Form.Item>
      <Form.Item label="用户邮箱" name="email" validateDebounce={300} rules={[CreateUserFormRule]}>
        <Input placeholder="邮箱" />
      </Form.Item>
    </>
  );
};

export default withActionForm(UserForm);
