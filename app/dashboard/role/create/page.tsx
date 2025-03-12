'use client';

import { redirect } from 'next/navigation';

import { createRoleAction } from '@/actions/role';

import RoleForm from '../components/role-form';

const Page = () => {
  return (
    <div>
      <RoleForm
        action={createRoleAction}
        onFinish={(state) => {
          console.log('onFinish', state);
          redirect('/dashboard/role');
        }}
      >
        额外字段

      </RoleForm>
    </div>
  );
};

export default Page;
