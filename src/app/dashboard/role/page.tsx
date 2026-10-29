/**
 * 角色管理
 *
 * sobird<i@sobird.me> at 2023/12/05 15:10:21 created.
 */

import { Button } from 'antd';
import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

import { createRoleAction } from '@/actions/role';
import withActionFormModal from '@/components/with-action-form-modal';
import { getCurrentAbility } from '@/services/ability';
import RoleService from '@/services/role';

import RoleForm from './components/role-form';
import RoleTable from './table';

export const metadata: Metadata = {
  title: '角色管理',
};

const RoleFormModal = withActionFormModal(RoleForm, { title: '创建角色' });

const RolePage = async ({ searchParams }: PageProps<'/dashboard/role'>) => {
  const { pn, ps } = await searchParams;
  const ability = await getCurrentAbility();
  const rolesWithPage = await RoleService.listWithPage(ability, {
    pn: Array.isArray(pn) ? pn[0] : pn,
    ps: Array.isArray(ps) ? ps[0] : ps,
  });

  return (
    <div>
      <Link href="/dashboard/role/create">
        <Button type="primary">创建角色</Button>
      </Link>
      <RoleFormModal action={createRoleAction}>创建角色</RoleFormModal>
      <RoleTable data={rolesWithPage} />
    </div>
  );
};

export default RolePage;
