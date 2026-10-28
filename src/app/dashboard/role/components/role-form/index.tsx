/**
 * 角色表单组件
 *
 * @package 业务级组件
 *
 * sobird<i@sobird.me> at 2023/12/21 22:06:48 created.
 */

'use client';

import { Form, Input } from 'antd';
import React, { PropsWithChildren } from 'react';

import withActionForm from '@/components/with-action-form';
import { RoleFormRule } from '@/zod/role';

const RoleForm: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <Form.Item hidden name="id">
        <Input name="id" hidden />
      </Form.Item>
      <Form.Item label="角色名称" name="name" rules={[RoleFormRule]}>
        <Input name="name" />
      </Form.Item>
      <Form.Item label="备注" name="description">
        <Input.TextArea name="description" />
      </Form.Item>
      {children}
    </>
  );
};

export default withActionForm(RoleForm);
