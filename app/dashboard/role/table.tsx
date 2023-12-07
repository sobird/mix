/**
 * 角色数据列表分页
 *
 * sobird<i@sobird.me> at 2023/12/05 23:10:57 created.
 */

'use client';

import { FC } from 'react';
import { Button, Table } from 'antd';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { RoleModel } from '@/models';

type RoleTableData = Awaited<ReturnType<typeof RoleModel.findAllWithPagination>>;

interface RoleTableProps {
  data: RoleTableData
}

const RoleTable:FC<RoleTableProps> = ({ data }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div style={{
      backgroundColor: 'rgb(249 250 251)',
      padding: '0.5rem',
    }}
    >
      <Table
        pagination={{
          position: ['bottomCenter'],
          current: data.pn,
          pageSize: data.ps,
          total: data.count,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            const params = new URLSearchParams(searchParams);
            params.set('pn', page);
            params.set('ps', pageSize);
            router.push(`${pathname}?${params.toString()}`);
          },
          itemRender: (page, type, originalElement) => {
            console.log('page', page, type, originalElement);

            return originalElement;
          },
        }}
        size="middle"
        dataSource={data.rows}
        rowKey="id"
      >
        <Table.Column title="角色名称" dataIndex="name" />
        <Table.Column title="角色描述" dataIndex="description" />
        <Table.Column title="创建时间" dataIndex="createdAt" />
        <Table.Column
          title="操作"
          dataIndex="actions"
          render={(value, record) => {
            return (
              <Button type="link">编辑</Button>
            );
          }}
        />
      </Table>
    </div>
  );
};

export default RoleTable;
