/**
 * /api/role/[id]
 *
 * sobird<i@sobird.me> at 2023/11/30 23:41:37 created.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RoleModel } from '@/models';

export async function GET(request: NextRequest, { params }) {
  const role = await RoleModel.findByPk(params.id);
  return NextResponse.json(role);
}

/** 更新角色 */
export async function PATCH(request: Request, { params }) {
  const body = await request.json();
  const role = await RoleModel.update(body, {
    where: {
      id: params.id,
    },
  });
  return NextResponse.json(role);
}
/** 删除角色 也将会删除所有的角色关系 */
export async function DELETE(request: Request, { params }) {
  const role = await RoleModel.destroy({
    where: {
      id: params.id,
    },
  });
  return NextResponse.json(role);
}
