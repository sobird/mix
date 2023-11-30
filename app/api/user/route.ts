import { NextResponse } from 'next/server';
import { UserModel, RoleModel } from '@/models';

export async function GET(request: Request) {
  const user = await UserModel.findAll({
    include: [RoleModel],
  });
  return NextResponse.json(user);
}

/** 创建用户 */
export async function POST(request: Request) {
  const body = await request.json();
  const user = await UserModel.create(body);
  return NextResponse.json(user);
}
