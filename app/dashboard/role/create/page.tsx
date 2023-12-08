import React from 'react';
import { createRole } from './action';
import RoleForm from './form';

const Page = () => {
  return (
    <div>

      <RoleForm action={createRole} />
    </div>
  );
};

export default Page;
