import { NextResponse } from 'next/server';
import { UserModel, RoleModel } from '@/models';
import { UserExcludeAttributes } from '@/models/user';

export async function GET(request: Request) {
  const roles = await RoleModel.findAll({
    include: [{
      model: UserModel,
      attributes: {
        exclude: UserExcludeAttributes,
      },
    }],
  });
  return NextResponse.json(roles);
}

/** 创建角色 */
export async function POST(request: Request) {
  const body = await request.json();
  const role = await RoleModel.create(body);
  return NextResponse.json(role);
}
