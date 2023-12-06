/**
 * 角色数据列表分页
 *
 * sobird<i@sobird.me> at 2023/12/05 23:10:57 created.
 */

'use client';

import { FC } from 'react';
import { Table } from 'antd';
import { useSearchParams } from 'next/navigation';
import type { RoleModel } from '@/models';

type RoleRowsWithPagination = Awaited<ReturnType<typeof RoleModel.findAllWithPagination>>;

interface RoleTableProps {
  data: RoleRowsWithPagination
}

const RoleTable:FC<RoleTableProps> = ({ data }) => {
  console.log('data', data);
  return (
    <div>
      <Table
        pagination={{
          position: ['bottomCenter'],
          current: data.pn,
          pageSize: data.ps,
          total: data.count,
          showSizeChanger: true,
          onChange: (page, pageSize) => {

          },
        }}
        bordered
        size="small"
        dataSource={data.rows}
        rowKey="id"
      >
        <Table.Column title="角色名称" dataIndex="name" />
        <Table.Column title="角色描述" dataIndex="description" />
        <Table.Column title="创建时间" dataIndex="createdAt" />
        <Table.Column title="操作" dataIndex="actions" />
      </Table>
    </div>
  );
};

export default RoleTable;
