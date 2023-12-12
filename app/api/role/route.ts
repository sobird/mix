import { NextRequest, NextResponse } from 'next/server';
import { UserModel, RoleModel, PermissionModel } from '@/models';
import { UserExcludeAttributes } from '@/models/user';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const pn = searchParams.get('pn');
  const ps = searchParams.get('ps');

  const rolesWithPage = await prisma.role.findManyByPage({
    pn,
    ps,
  });

  return NextResponse.json(rolesWithPage);
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
