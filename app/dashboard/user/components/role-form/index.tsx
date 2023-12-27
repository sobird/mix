'use client';

import React, { useEffect } from 'react';
import {
  Form, Input, Button, message,
} from 'antd';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { RoleFormRule, RoleFormAttributes } from '@/zod/role';
import { createRoleAction } from '@/actions/role';
import useServerAction from '@/hooks/useServerAction';

const formItemLayout = {
  labelCol: {
    flex: '0 0 110px',
  },
  wrapperCol: { span: 12 },
};

interface RoleFormProps {
  action: typeof createRoleAction,
  initialValues?: RoleFormAttributes
}

const RoleForm: React.FC<RoleFormProps> = ({ action, initialValues }) => {
  const initialState = null;
  const [state, dispatch, pending] = useServerAction(action, initialState);

  useEffect(() => {
    if (!state) {
      return;
    }

    if (!state.success) {
      message.error(state.message);
    }
  }, [state]);

  return (
    <Form onFinish={dispatch} initialValues={initialValues} {...formItemLayout}>
      <Form.Item hidden name="id">
        <Input name="id" hidden />
      </Form.Item>
      <Form.Item label="用户名" name="username">
        <Input name="name" />
      </Form.Item>
      <Form.Item label="邮箱" name="email">
        <Input name="email" />
      </Form.Item>
      <Form.Item label="角色" name="roles">
        <Input name="roles" />
      </Form.Item>
      <Button type="primary" htmlType="submit" disabled={pending}>提交</Button>
    </Form>
  );
};

export default RoleForm;
