/**
 * 用户管理
 *
 * sobird<i@sobird.me> at 2023/12/05 15:10:21 created.
 */

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from 'antd';
import UserTable from './table';
import { UserModel } from '@/models';
import UserFormModal from './components/role-form-modal';

export const metadata: Metadata = {
  title: '用户管理',
};

type IUserAppPage = IAppPage<PaginationSearchParams>;

const UserPage: IUserAppPage = async ({ searchParams }) => {
  const userWithPage = await UserModel.findManyByPage(searchParams);

  return (
    <div>
      <Link href="/dashboard/role/create"><Button type="primary">创建角色</Button></Link>
      <UserTable data={userWithPage} />
      {/* <UserFormModal /> */}
    </div>
  );
};

export default UserPage;
