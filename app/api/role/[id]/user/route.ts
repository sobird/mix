/**
 * /api/user/[id]/role
 *
 * sobird<i@sobird.me> at 2023/11/30 22:38:26 created.
 */

import { NextResponse } from 'next/server';
import { RoleModel } from '@/models';
import { UserExcludeAttributes } from '@/models/user';

/** 查询角色下的用户 */
export async function GET(request: Request, { params }) {
  const role = await RoleModel.findByPk(params.id);
  const users = await role?.getUsers({
    attributes: {
      exclude: UserExcludeAttributes,
    },
  });
  return NextResponse.json(users);
}

/** 在此角色下添加用户 */
export async function POST(request: Request, { params }) {
  const body = await request.json();

  const role = await RoleModel.findByPk(params.id);
  const userRole = await role?.addUsers(body.ids);
  return NextResponse.json(userRole);
}
