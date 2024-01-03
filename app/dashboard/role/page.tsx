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

import RoleForm from './components/role-form';
import { createRoleAction } from '@/actions/role';
import withActionFormModal from '@/components/with-action-form-modal';

export const metadata: Metadata = {
  title: '角色管理',
};

type IRoleAppPage = IAppPage<PaginationSearchParams>;

const RoleFormModal = withActionFormModal(RoleForm, { title: '创建角色' });

const RolePage: IRoleAppPage = async ({ searchParams }) => {
  const rolesWithPage = await RoleModel.findManyByPage(searchParams);

  return (
    <div>
      <Link href="/dashboard/role/create"><Button type="primary">创建角色</Button></Link>
      <RoleFormModal action={createRoleAction}>按钮</RoleFormModal>
      <RoleTable data={rolesWithPage} />
    </div>
  );
};

export default RolePage;
