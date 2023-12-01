import { NextResponse } from 'next/server';
import { UserModel, RoleModel, PermissionModel } from '@/models';
import { UserExcludeAttributes } from '@/models/user';

export async function GET() {
  const roles = await RoleModel.findAll({
    include: [{
      model: UserModel,
      attributes: {
        exclude: UserExcludeAttributes,
      },
    }, {
      model: PermissionModel,
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

/**
 * 强制同步role模型表
 *
 * @todo 不可上生产环境
 * @returns
 */
export async function PUT() {
  await RoleModel.sync({ force: true });
  return NextResponse.json({
    message: 'ok',
  });
}
