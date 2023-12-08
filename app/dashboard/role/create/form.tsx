'use client';

import React from 'react';
import { Form, Input, Button } from 'antd';

const formItemLayout = {
  labelCol: {
    flex: '0 0 110px',
  },
  wrapperCol: { span: 12 },
};

interface RoleFormProps {
  action: (formData: FormData) => Promise<void>,
  initialValues?: object
}

const RoleForm: React.FC<RoleFormProps> = ({ action, initialValues }) => {
  return (
    <Form onFinish={action} initialValues={initialValues} {...formItemLayout}>
      <Form.Item label="角色名称" name="name">
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
