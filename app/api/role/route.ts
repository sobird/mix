import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { UserModel, RoleModel, PermissionModel } from '@/models';
import { UserExcludeAttributes } from '@/models/user';
import prisma from '@/lib/prisma';
import { create } from '@/actions/role';

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  try {
    const roles = await prisma.role.findManyByPage(searchParams);
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({
      message: error.message,
    }, {
      status: 500,
    });
  }
}

/** 创建角色 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const role = await create(null, body);

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
