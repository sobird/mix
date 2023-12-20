/**
 * 用户注册表单
 *
 * sobird<i@sobird.me> at 2023/11/28 15:53:54 created.
 */

'use client';

import { ChangeEvent, useState } from 'react';
import { useFormState } from 'react-dom';
import {
  Input, Button, Form, ConfigProvider, Space,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { signup } from '@/actions/user';
import { SignUpFormRule, SignUpPasswordRule } from '@/zod/user';

export const SignupForm = () => {
  const [form] = Form.useForm();
  const [state, dispatch] = useFormState(signup, null);
  console.log('state', state);
  return (
    <ConfigProvider componentSize="large">
      <Form
        form={form}
        onFinish={dispatch}
      >
        <Form.Item
          hasFeedback
          name="username"
          validateDebounce={300}
          rules={[SignUpFormRule]}
        >
          <Input placeholder="用户名" />
        </Form.Item>
        <Form.Item name="password" rules={[SignUpPasswordRule]}>
          <Input.Password placeholder="登录密码" />
        </Form.Item>
        <Form.Item name="confirmPassword" dependencies={['password']} rules={[SignUpPasswordRule]}>
          <Input.Password placeholder="密码确认" />
        </Form.Item>
        <Form.Item hasFeedback name="email" rules={[SignUpFormRule]}>
          <Input placeholder="邮箱" />
        </Form.Item>
        <Form.Item name="verificationCode" rules={[SignUpFormRule]}>
          <Input placeholder="验证码" />
        </Form.Item>

        <h3>对象嵌套</h3>
        <Form.Item name={['user', 'name']} label="Name" rules={[SignUpFormRule]}>
          <Input />
        </Form.Item>
        <Form.Item name={['user', 'email']} label="Email" rules={[SignUpFormRule]}>
          <Input />
        </Form.Item>

        <h3>数组嵌套</h3>
        <Form.List
          name="users"
          rules={[SignUpFormRule(form)]}
        >
          {(fields, { add, remove }, { errors }) => {
            return (
              <>
                {fields.map(({ key, name, ...restField }) => {
                  return (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'first']}
                        rules={[SignUpFormRule]}
                      >
                        <Input placeholder="First Name" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'last']}
                        rules={[SignUpFormRule]}
                        // rules={[{ required: true, message: 'Missing last name' }]}
                      >
                        <Input placeholder="Last Name" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => { return remove(name); }} />
                    </Space>
                  );
                })}
                <Form.Item>
                  <Button type="dashed" onClick={() => { return add(); }} block icon={<PlusOutlined />}>
                    Add field
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            );
          }}
        </Form.List>

        <Button
          type="primary"
          style={{ width: '100%', borderColor: 'transparent' }}
          htmlType="submit"
        >
          注册
        </Button>
      </Form>
    </ConfigProvider>
  );
};
