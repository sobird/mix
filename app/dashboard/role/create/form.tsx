'use client';

import React from 'react';
import { useFormState } from 'react-dom';
import { Form, Input, Button } from 'antd';
import { ZodRule } from '@/zod/role';
import { create } from '@/actions/role';

const formItemLayout = {
  labelCol: {
    flex: '0 0 110px',
  },
  wrapperCol: { span: 12 },
};

interface RoleFormProps {
  action: typeof create,
  initialValues?: object
}

const RoleForm: React.FC<RoleFormProps> = ({ action, initialValues }) => {
  const [state, dispatch] = useFormState(action, null);
  console.log('state', state);

  return (
    <Form onFinish={dispatch} initialValues={initialValues} {...formItemLayout}>
      <Form.Item label="角色名称" name="name" rules={[ZodRule]}>
        <Input name="name" />
      </Form.Item>
      <Form.Item label="描述" name="description">
        <Input.TextArea name="description" />
      </Form.Item>

      <Button htmlType="submit">提交</Button>
    </Form>
  );
};

export default RoleForm;
