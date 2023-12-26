'use client';

import React from 'react';
import { Form, Input, Button } from 'antd';
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
  const initialState = {};
  const [state, dispatch, pending] = useServerAction(action, initialState);
  console.log('state', state);

  return (
    <Form onFinish={dispatch} initialValues={initialValues} {...formItemLayout}>
      <Form.Item hidden name="id">
        <Input name="id" hidden />
      </Form.Item>
      <Form.Item label="角色名称" name="name" rules={[RoleFormRule]}>
        <Input name="name" />
      </Form.Item>
      <Form.Item label="描述" name="description">
        <Input.TextArea name="description" />
      </Form.Item>
      <Button type="primary" htmlType="submit" disabled={pending}>提交</Button>
    </Form>
  );
};

export default RoleForm;
