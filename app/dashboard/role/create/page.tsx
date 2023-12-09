import React from 'react';
import sequelize from 'sequelize';
import { createRole } from './action';
import RoleForm from './form';

const Page = () => {
  console.log('sequelize', sequelize);

  return (
    <div>

      <RoleForm action={createRole} />
    </div>
  );
};

export default Page;
