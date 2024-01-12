/**
 * 角色数据列表分页
 *
 * sobird<i@sobird.me> at 2023/12/05 23:10:57 created.
 */

'use client';

import { FC } from 'react';
import {
  Button, Table, Modal, Switch,
} from 'antd';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserModel, UserAttributes } from '@/models';
import { deleteUserAction } from '@/actions/user';

type UserTableData = Awaited<ReturnType<typeof UserModel.findManyByPage<UserModel>>>;

interface UserTableProps {
  data: UserTableData
}

const UserTable:FC<UserTableProps> = ({ data }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div style={{
      backgroundColor: 'rgb(249 250 251)',
      padding: '0.5rem',
    }}
    >
      <Table<UserAttributes>
        pagination={{
          hideOnSinglePage: true,
          position: ['bottomCenter'],
          current: data.pn,
          pageSize: data.ps,
          total: data.count,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            const params = new URLSearchParams(searchParams?.toString());
            params.set('pn', page);
            params.set('ps', pageSize);
            router.push(`${pathname}?${params.toString()}`);
          },
          itemRender: (page, type, originalElement) => {
            // console.log('page', page, type, originalElement);

            return originalElement;
          },
        }}
        size="middle"
        dataSource={data.rows}
        rowKey="id"
      >
        <Table.Column title="用户名" dataIndex="username" />
        <Table.Column title="邮箱" dataIndex="email" />
        <Table.Column
          title="创建时间"
          dataIndex="createdAt"
        />
        <Table.Column
          title="状态"
          dataIndex="status"
          render={(status) => {
            return <Switch disabled checkedChildren="正常" unCheckedChildren="停用" defaultChecked={status} />;
          }}
        />
        <Table.Column<any>
          title="操作"
          dataIndex="actions"
          render={(value, record) => {
            return (
              <>
                <Link href={`/dashboard/user/${record.id}/edit`}>编辑</Link>

                <Button
                  type="link"
                    // htmlType="submit"
                  onClick={() => {
                    Modal.confirm({
                      title: '系统提示',
                      content: `是否确认删除用户：${record.username} ？`,
                      async onOk() {
                        await deleteUserAction(record.id);
                      },
                    });
                  }}
                >
                  删除
                </Button>
              </>
            );
          }}
        />
      </Table>
    </div>
  );
};

export default UserTable;
