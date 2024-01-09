'use client';

import React from 'react';
import {
  Row, Col, Form, Input,
} from 'antd';
import {
  UserFormRule, usernameRule, emailRule, passwordRule,
} from '@/zod/user';
import withActionForm from '@/components/with-action-form';
import DebounceSelect from '@/components/debounce-select';

const InternalUserForm: React.FC<WithFormProps> = ({ mode, data }) => {
  const { roleOptions } = data;
  return (
    <Row gutter={[15, 0]}>
      <Form.Item name="id">
        <Input name="id" hidden />
      </Form.Item>
      <Col span={12}>
        <Form.Item
          name="username"
          label="用户名"
          validateDebounce={300}
          rules={[usernameRule]}
          required
        >
          <Input placeholder="用户登录名称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="nickname"
          label="用户昵称"
          validateDebounce={300}
        >
          <Input placeholder="用户昵称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="realname" label="真实姓名" rules={[UserFormRule]}>
          <Input placeholder="用户真实姓名" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="gender" label="性别">
          <Input placeholder="性别" />
        </Form.Item>
      </Col>

      {mode === 'create' && (
      <>
        <Col span={12}>
          <Form.Item label="登录密码" name="password" rules={[passwordRule]} required>
            <Input.Password placeholder="登录密码" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="密码确认" name="confirmPassword" dependencies={['password']} rules={[passwordRule]} required>
            <Input.Password placeholder="密码确认" />
          </Form.Item>
        </Col>
      </>
      )}

      <Col span={12}>
        <Form.Item label="用户邮箱" name="email" validateDebounce={300} rules={[emailRule]} required>
          <Input placeholder="邮箱" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="手机号码" name="mobile">
          <Input placeholder="用户手机号码" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="角色" name="roles">
          <DebounceSelect options={roleOptions} mode="multiple" placeholder="请选择" />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default withActionForm(InternalUserForm);
