/**
 * 角色管理入口
 *
 * sobird<i@sobird.me> at 2023/12/05 15:10:21 created.
 */

// 'use client';

import React from 'react';
import { Table } from 'antd';
import { RoleModel } from '@/models';

const user = RoleModel.findAllWithPagination({ ps: 20, ps: 1 });
// RoleModel.create({

// });

user.then((res) => {
  console.log('res', res);
});

const RolePage = () => {
  return (
    <div>
      {/* <Table size="small">
        <Table.Column title="角色名称" dataIndex="name" />
        <Table.Column title="创建时间" dataIndex="createAt" />
        <Table.Column title="操作" dataIndex="actions" />
      </Table> */}
    </div>
  );
};

export default RolePage;
