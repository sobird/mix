/**
 * 编辑角色页面
 *
 * sobird<i@sobird.me> at 2023/12/08 22:40:59 created.
 */

import React from 'react';
import { RoleModel } from '@/models';
import RoleForm from '../../create/form';
import { createRole } from '../../create/action';

interface RoleEditPageProps {
  params: {
    id: string;
  };
}

const Page: React.FC<RoleEditPageProps> = async ({ params }) => {
  const { id } = params;

  const role = await RoleModel.findOne({
    where: {
      id,
    },
    raw: true,
  });

  console.log('role', role);
  return (
    <RoleForm action={createRole} initialValues={role} />
  );
};

export default Page;
