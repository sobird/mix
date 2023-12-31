'use client';

import React, { useTransition } from 'react';
import { redirect } from 'next/navigation';
import { createRoleAction } from '@/actions/role';
import RoleForm from '../components/role-form';

const Page = () => {
  return (
    <div>
      <RoleForm action={createRoleAction} />
    </div>
  );
};

export default Page;
