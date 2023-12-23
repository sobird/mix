import { NextRequest, NextResponse } from 'next/server';
import { RoleModel } from '@/models';
import { createRoleAction, updateRoleAction } from '@/actions/role';

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  try {
    const roles = await RoleModel.findManyByPage(searchParams);
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

  const role = await createRoleAction(null, body);

  return NextResponse.json(role);
}

/** 更新角色 */
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const role = await updateRoleAction(null, body);
  return NextResponse.json(role);
}

export async function DELETE(request: NextRequest) {
  // todo
  const body = await request.json();
  console.log('body', body);
}
