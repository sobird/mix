/**
 * 用户管理
 *
 * sobird<i@sobird.me> at 2023/12/05 15:10:21 created.
 */

import { Button } from 'antd';
import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

import { UserModel } from '@/models';

import UserTable from './table';

export const metadata: Metadata = {
  title: '用户管理',
};

interface SearchParams extends PaginationSearchParams {
  //
}

const UserPage: AppPage<{}, SearchParams> = async ({ searchParams }) => {
  const userWithPage = await UserModel.findManyByPage(await searchParams);

  return (
    <div>
      <Link href="/dashboard/user/create"><Button type="primary">创建用户</Button></Link>
      <UserTable data={userWithPage} />
    </div>
  );
};

export default UserPage;
