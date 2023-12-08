/**
 * 角色管理
 *
 * sobird<i@sobird.me> at 2023/12/05 15:10:21 created.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { Button } from 'antd';
import { RoleModel } from '@/models';
import RoleTable from './table';

export const metadata: Metadata = {
  title: '角色管理',
};

interface RolePageProps {
  searchParams: IPaginationSearchParams
}

const RolePage: React.FC<RolePageProps> = async ({ searchParams }) => {
  const roleTableData = await RoleModel.findAllWithPagination(searchParams);
  return (
    <div>
      <Link href="/dashboard/role/create"><Button type="primary">创建角色</Button></Link>

      <RoleTable data={roleTableData} />
    </div>
  );
};

export default RolePage;
