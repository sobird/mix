import React from 'react';
import { createRoleAction } from '@/actions/role';
import RoleForm from './form';

const Page = () => {
  return (
    <div>
      <RoleForm action={createRoleAction} />
    </div>
  );
};

export default Page;
