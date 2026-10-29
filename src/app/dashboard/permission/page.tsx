/**
 * 权限管理
 */

import { Table } from 'antd';
import type { Metadata } from 'next';
import React from 'react';

import { getCurrentAbility } from '@/services/ability';
import PermissionService from '@/services/permission';

export const metadata: Metadata = {
  title: '权限管理',
};

const columns = [
  { title: '主题', dataIndex: 'subject', key: 'subject' },
  { title: '动作', dataIndex: 'action', key: 'action' },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '描述', dataIndex: 'description', key: 'description' },
];

const PermissionPage: AppPage = async () => {
  const ability = await getCurrentAbility();
  const permissions = await PermissionService.list(ability);

  return <Table rowKey="id" columns={columns} dataSource={permissions} />;
};

export default PermissionPage;
