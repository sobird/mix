import { NextResponse } from 'next/server';
import { UserModel, RoleModel } from '@/models';

export async function GET(request: Request) {
  const user = await UserModel.findAll({
    include: [RoleModel],
  });
  return NextResponse.json(user);
}

/** 创建角色 */
export async function POST(request: Request) {
  const body = await request.json();
  const role = await RoleModel.create(body);
  return NextResponse.json(role);
}
