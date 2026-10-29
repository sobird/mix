/**
 * 用户管理
 *
 * sobird<i@sobird.me> at 2023/12/05 15:10:21 created.
 */

import { Button } from 'antd';
import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

import { getCurrentAbility } from '@/services/ability';
import { UserService } from '@/services/user';

import UserTable from './table';

export const metadata: Metadata = {
  title: '用户管理',
};

const UserPage = async ({ searchParams }: PageProps<'/dashboard/user'>) => {
  const { pn, ps } = await searchParams;
  const ability = await getCurrentAbility();
  const userWithPage = await UserService.listWithPage(ability, {
    pn: Array.isArray(pn) ? pn[0] : pn,
    ps: Array.isArray(ps) ? ps[0] : ps,
  });

  return (
    <div>
      <Link href="/dashboard/user/create">
        <Button type="primary">创建用户</Button>
      </Link>
      <UserTable data={userWithPage} />
    </div>
  );
};

export default UserPage;
