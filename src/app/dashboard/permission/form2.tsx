'use client';

import { Tree, message, Card, Select, Button } from 'antd';
import type { TreeDataNode } from 'antd';
import React, { useState } from 'react';

const { Option } = Select;

interface MockPermission {
  id: string;
  name: string;
  children?: MockPermission[];
}

const mockPermissions: MockPermission[] = [
  {
    id: 'sys',
    name: '系统管理',
    children: [
      {
        id: 'user',
        name: '用户管理',
        children: [
          { id: 'user:view', name: '查看用户' },
          { id: 'user:edit', name: '编辑用户' },
          { id: 'user:delete', name: '删除用户' },
        ],
      },
      {
        id: 'role',
        name: '角色管理',
        children: [
          { id: 'role:view', name: '查看角色' },
          { id: 'role:edit', name: '编辑角色' },
        ],
      },
    ],
  },
  {
    id: 'content',
    name: '内容管理',
    children: [
      { id: 'post:view', name: '查看内容' },
      { id: 'post:edit', name: '编辑内容' },
    ],
  },
];

const mockRolePermissions: Record<number, React.Key[]> = {
  1: [
    'sys',
    'user',
    'user:view',
    'user:edit',
    'user:delete',
    'role',
    'role:view',
    'role:edit',
    'content',
    'post:view',
    'post:edit',
  ],
  2: ['content', 'post:view', 'post:edit'],
  3: ['post:view'],
};

// 转换权限数据结构为Tree需要的格式
const convertPermissions = (data: MockPermission[]): TreeDataNode[] => {
  return data.map((item) => {
    return {
      title: item.name,
      key: item.id,
      children: item.children ? convertPermissions(item.children) : undefined,
    };
  });
};

const PermissionEditor = () => {
  const roles = [
    { id: 1, name: '管理员' },
    { id: 2, name: '编辑' },
    { id: 3, name: '普通用户' },
  ];

  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [permissions] = useState(() => {
    return convertPermissions(mockPermissions);
  });
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

  const handleRoleChange = (roleId: number) => {
    setSelectedRole(roleId);
    setCheckedKeys(mockRolePermissions[roleId] ?? []);
  };

  const handleSave = () => {
    if (!selectedRole) {
      message.warning('请先选择角色');
      return;
    }

    message.success('权限保存成功');
  };

  return (
    <Card
      title="角色权限管理"
      extra={
        <Button type="primary" onClick={handleSave} disabled={!selectedRole}>
          保存权限
        </Button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Select placeholder="选择角色" style={{ width: 200 }} onChange={handleRoleChange}>
          {roles.map((role) => {
            return (
              <Option key={role.id} value={role.id}>
                {role.name}
              </Option>
            );
          })}
        </Select>
      </div>

      <Tree
        checkable
        checkedKeys={checkedKeys}
        onCheck={(keys) => {
          return setCheckedKeys(Array.isArray(keys) ? keys : keys.checked);
        }}
        treeData={permissions}
        height={400}
        selectable={false}
      />
    </Card>
  );
};

export default PermissionEditor;
