/**
 * 编辑角色页面
 *
 * sobird<i@sobird.me> at 2023/12/08 22:40:59 created.
 */

import { NextPage } from 'next';
import React from 'react';
import RoleForm from '../../create/form';
import { updateRoleAction } from '@/actions/role';
import { RoleModel } from '@/models';

interface RoleEditPageProps {
  params: {
    id: string;
  };
}

const Page: NextPage<RoleEditPageProps> = async ({ params }) => {
  const { id } = params;

  const role = await RoleModel.findOne({
    where: {
      id,
    },
  });

  return (
    <RoleForm action={updateRoleAction} initialValues={role?.get()} />
  );
};

export default Page;
