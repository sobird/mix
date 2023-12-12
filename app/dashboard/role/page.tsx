/**
 * 角色管理
 *
 * sobird<i@sobird.me> at 2023/12/05 15:10:21 created.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { Button } from 'antd';
import RoleTable from './table';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: '角色管理',
};

interface RolePageProps extends PropsWithParams<any, PaginationSearchParams> {
  //
}

const RolePage: React.FC<RolePageProps> = async (props) => {
  const role = await prisma.role.findManyByPage({
    ...props.searchParams,
    select: {
      description: true,
      name: true,
    },
  });

  return (
    <div>
      <Link href="/dashboard/role/create"><Button type="primary">创建角色</Button></Link>
      <RoleTable data={role} />
    </div>
  );
};

export default RolePage;
