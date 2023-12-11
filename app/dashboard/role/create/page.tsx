import React from 'react';
import sequelize from 'sequelize';
import { create } from '@/actions/role';
import RoleForm from './form';

const Page = () => {
  console.log('sequelize', sequelize);

  return (
    <div>

      <RoleForm action={create} />
    </div>
  );
};

export default Page;
