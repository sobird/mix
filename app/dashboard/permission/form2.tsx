'use client';

import {
  Tree, Spin, message, Card, Select, Button,
  Checkbox,
  Row,
  Col,
} from 'antd';
import React, { useState, useEffect } from 'react';
// import { getPermissions, getRolePermissions, updateRolePermissions } from './api';

const { Option } = Select;

const mockPermissions = [
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

const plainOptions = ['Apple', 'Pear', 'Orange'];

const PermissionEditor = () => {
  const [roles, setRoles] = useState([
    { id: 1, name: '管理员' },
    { id: 2, name: '编辑' },
    { id: 3, name: '普通用户' },
  ]);

  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [loading, setLoading] = useState(false);

  // 转换权限数据结构为Tree需要的格式
  const convertPermissions = (data) => {
    return data.map((item) => {
      return {
        title: item.name,
        key: item.id,
        children: item.children ? convertPermissions(item.children) : null,
      };
    });
  };

  // 加载权限数据
  const loadPermissions = async () => {
    setLoading(true);
    try {
      // const data = await getPermissions();
      const data = mockPermissions; // 使用模拟数据
      setPermissions(convertPermissions(data));
    } catch (error) {
      message.error('加载权限失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载角色权限
  const loadRolePermissions = async (roleId) => {
    setLoading(true);
    try {
      // const data = await getRolePermissions(roleId);
      const mockData = { // 模拟响应数据
        1: ['sys', 'user', 'user:view', 'user:edit', 'user:delete', 'role', 'role:view', 'role:edit', 'content', 'post:view', 'post:edit'],
        2: ['content', 'post:view', 'post:edit'],
        3: ['post:view'],
      };
      setCheckedKeys(mockData[roleId] || []);
    } catch (error) {
      message.error('加载角色权限失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    loadRolePermissions(roleId);
  };

  const handleSave = async () => {
    if (!selectedRole) {
      message.warning('请先选择角色');
      return;
    }

    try {
      // await updateRolePermissions(selectedRole, checkedKeys);
      message.success('权限保存成功');
    } catch (error) {
      message.error('保存权限失败');
    }
  };

  return (
    <Card
      title="角色权限管理"
      extra={(
        <Button
          type="primary"
          onClick={handleSave}
          disabled={!selectedRole}
        >
          保存权限
        </Button>
      )}
    >

      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择角色"
          style={{ width: 200 }}
          onChange={handleRoleChange}
        >
          {roles.map((role) => {
            return (
              <Option key={role.id} value={role.id}>{role.name}</Option>
            );
          })}
        </Select>
      </div>

      <Spin spinning={loading}>
        <Tree
          checkable
          checkedKeys={checkedKeys}
          onCheck={(keys) => { return setCheckedKeys(keys); }}
          treeData={permissions}
          height={400}
          selectable={false}
        />
      </Spin>
    </Card>
  );
};

export default PermissionEditor;
