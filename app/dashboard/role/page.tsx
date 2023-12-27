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
import RoleFormModal from './components/role-form-modal';

export const metadata: Metadata = {
  title: '角色管理',
};

type IRoleAppPage = IAppPage<PaginationSearchParams>;

const RolePage: IRoleAppPage = async ({ searchParams }) => {
  const rolesWithPage = await RoleModel.findManyByPage(searchParams);
  const roles = await RoleModel.scope([{
    method: ['random', 'dd'],
  }, 'parent']).findAll({ raw: true });
  console.log('roles', roles);

  return (
    <div>
      <Link href="/dashboard/role/create"><Button type="primary">创建角色</Button></Link>
      <RoleTable data={rolesWithPage} />
      <RoleFormModal />
    </div>
  );
};

export default RolePage;
