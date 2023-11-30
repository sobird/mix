import { NextResponse } from 'next/server';
import { UserModel } from '@/models';

export async function GET(request: Request, { params }) {
  console.log('params', params);

  const user = await UserModel.findByPk(params.id);
  const userRole = await user?.addRole([1]);
  return NextResponse.json(user);
}

/** 创建用户 */
export async function POST(request: Request) {
  const body = await request.json();
  const user = await UserModel.create(body);
  return NextResponse.json(user);
}
