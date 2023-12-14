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
export async function POST({ nextUrl, json }: NextRequest) {
  const body = await json();
  const path = nextUrl.searchParams.get('path');

  const role = await create({
    revalidate: {
      path: '/test',
    },
  }, body);

  console.log('role', role);

  revalidatePath('/dashboard/role');
  return NextResponse.json(role);
}

/** 更新角色 */
export async function PATCH(request: NextRequest) {
  await RoleModel.sync({ force: true });
  return NextResponse.json({
    message: 'ok',
  });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  console.log('body', body);
}
