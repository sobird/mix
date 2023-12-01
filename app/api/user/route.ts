import { NextResponse } from 'next/server';
import { UserModel, RoleModel } from '@/models';

export async function GET(request: Request) {
  const user = await UserModel.findAll({
    include: [{
      model: RoleModel,
      // as: 'Roles',
    }],
  });
  return NextResponse.json(user);
}

/** 创建用户 */
export async function POST(request: Request) {
  const body = await request.json();
  const user = await UserModel.create(body);
  return NextResponse.json(user);
}

/**
 * 强制同步role模型表
 *
 * @todo 不可上生产环境
 * @returns
 */
export async function PUT() {
  await UserModel.sync({ force: true });
  return NextResponse.json({
    message: 'ok',
  });
}
