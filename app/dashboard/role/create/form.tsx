'use client';

import React from 'react';
import { Form, Input, Button } from 'antd';
import { createRole } from './action';

const formItemLayout = {
  labelCol: {
    flex: '0 0 110px',
  },
  wrapperCol: { span: 12 },
};

const RoleForm = () => {
  return (
    <div>
      <Form onFinish={createRole} {...formItemLayout}>
        <Form.Item label="角色名称" name="name">
          <Input name="name" />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Input.TextArea name="description" />
        </Form.Item>

        <Button htmlType="submit">提交</Button>
      </Form>
    </div>
  );
};

export default RoleForm;
