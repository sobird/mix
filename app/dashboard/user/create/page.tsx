import React from 'react';
import { createUserAction } from '@/actions/user';
import UserForm from '../components/user-form';

const Page = () => {
  return (
    <div>
      <UserForm action={createUserAction} />
    </div>
  );
};

export default Page;
