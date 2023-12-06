/**
 * 角色管理入口
 *
 * sobird<i@sobird.me> at 2023/12/05 15:10:21 created.
 */

import React from 'react';
import { RoleModel } from '@/models';
import RoleTable from './table';

const RolePage = async ({ searchParams, params }) => {
  const roleRows = await RoleModel.findAllWithPagination(searchParams);

  return (
    <div>
      <RoleTable data={roleRows} />
    </div>
  );
};

export default RolePage;
