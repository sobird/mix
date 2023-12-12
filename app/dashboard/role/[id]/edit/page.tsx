/**
 * 编辑角色页面
 *
 * sobird<i@sobird.me> at 2023/12/08 22:40:59 created.
 */

import React from 'react';
import RoleForm from '../../create/form';
import { update } from '@/actions/role';
import prisma from '@/lib/prisma';

interface RoleEditPageProps {
  params: {
    id: string;
  };
}

const Page: React.FC<RoleEditPageProps> = async ({ params }) => {
  const { id } = params;

  const role = await prisma.role.findUnique({
    where: {
      id,
    },
  });

  console.log('role', role);

  return (
    <RoleForm action={update} initialValues={role} />
  );
};

export default Page;
