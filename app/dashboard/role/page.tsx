/**
 * 角色管理
 *
 * sobird<i@sobird.me> at 2023/12/05 15:10:21 created.
 */

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from 'antd';
import RoleTable from './table';
import { RoleModel } from '@/models';

export const metadata: Metadata = {
  title: '角色管理',
};

interface RolePageProps extends PropsWithParams<any, PaginationSearchParams> {
  //
}

const RolePage: React.FC<RolePageProps> = async ({ searchParams }) => {
  const rolesWithPage = await RoleModel.findManyByPage(searchParams);

  return (
    <div>
      <Link href="/dashboard/role/create"><Button type="primary">创建角色</Button></Link>
      <RoleTable data={rolesWithPage} />
    </div>
  );
};

export default RolePage;
