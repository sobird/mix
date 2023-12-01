import { NextResponse } from 'next/server';
import { UserModel } from '@/models';

export async function GET(request: Request, { params }) {
  const user = await UserModel.findByPk(params.id);
  return NextResponse.json(user);
}

/** 创建用户 */
export async function POST(request: Request) {
  const body = await request.json();
  const user = await UserModel.create(body);
  return NextResponse.json(user);
}

/** 更新用户 */
export async function PATCH(request: Request, { params }) {
  const body = await request.json();
  const role = await UserModel.update(body, {
    where: {
      id: params.id,
    },
  });
  return NextResponse.json(role);
}

/** 删除用户 也将会删除所有的用户角色关系 */
export async function DELETE(request: Request, { params }) {
  const role = await UserModel.destroy({
    where: {
      id: params.id,
    },
  });
  return NextResponse.json(role);
}
