import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { UserModel, RoleModel, PermissionModel } from '@/models';
import { UserExcludeAttributes } from '@/models/user';
import prisma from '@/lib/prisma';
import { create } from '@/actions/role';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const pn = Number(searchParams.get('pn'));
  const ps = Number(searchParams.get('ps'));

  try {
    const rolesWithPage = await prisma.role.findManyByPage({
      pn,
      ps,
    });
    return NextResponse.json(rolesWithPage);
  } catch (error) {
    //
  }
}

/** 创建角色 */
export async function POST(request: Request) {
  const body = await request.json();
  console.log('body', body);
  const role = await create(null, body);
  console.log('role', role);

  revalidatePath('/dashboard/role');
  return NextResponse.json({});
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
