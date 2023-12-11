import React from 'react';
import { create } from '@/actions/role';
import RoleForm from './form';

const Page = () => {
  return (
    <div>

      <RoleForm action={create} />
    </div>
  );
};

export default Page;
