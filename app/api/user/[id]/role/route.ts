/**
 * /api/user/[id]/role
 *
 * sobird<i@sobird.me> at 2023/11/30 22:38:26 created.
 */

import { NextResponse } from 'next/server';
import { UserModel } from '@/models';

/** 查询用户角色 */
export async function GET(request: Request, { params }) {
  const user = await UserModel.findByPk(params.id);
  const userRole = await user?.getRoles();
  return NextResponse.json(userRole);
}

/** 添加用户角色 */
export async function POST(request: Request, { params }) {
  const body = await request.json();
  const user = await UserModel.findByPk(params.id);
  const userRole = await user?.addRoles(body.ids);
  return NextResponse.json(userRole);
}
