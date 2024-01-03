'use server';

import { redirect } from 'next/navigation';
import { WhereOptions } from 'sequelize';

import { UserModel } from '@/models';
import { generate, verify } from '@/lib/otp';
import { transporter } from '@/lib/mailer';
import reactToHtml from '@/lib/reactToHtml';
import CaptchaEmailBody from '@/components/email-template/captcha';
import {
  SignUpZodWithRefine, SignUpAttributes, CreateUserZodWithRefine, CreateUserAttributes,
} from '@/zod/user';
import { ActionStatus } from '.';

type SignUpServerActionState = ServerActionState<SignUpAttributes>;

/**
 * 注册用户
 *
 * @param prevState
 * @param payload
 * @returns
 */
export async function signUpAction(
  payload: SignUpAttributes,
): Promise<SignUpServerActionState> {
  const validatedFields = await SignUpZodWithRefine.safeParseAsync(payload);
  if (!validatedFields.success) {
    return {
      status: ActionStatus.FAILURE,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation Fields Failed to Sign Up.',
    };
  }

  // 验证码是否有效
  const isValid = verify(payload.verificationCode, payload.email);

  if (!isValid) {
    return {
      status: ActionStatus.FAILURE,
      message: '验证码无效',
    };
  }

  const [, created] = await UserModel.signUp(payload);
  // 已存在
  if (!created) {
    return {
      status: ActionStatus.FAILURE,
      message: '账户已存在',
    };
  }

  redirect('/signup/success');
}

export async function createUserAction(
  payload: CreateUserAttributes,
): Promise<SignUpServerActionState> {
  const validatedFields = await CreateUserZodWithRefine.safeParseAsync(payload);
  if (!validatedFields.success) {
    return {
      status: ActionStatus.FAILURE,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation Fields Failed to Sign Up.',
    };
  }

  const [, created] = await UserModel.signUp(payload);
  // 已存在
  if (!created) {
    return {
      status: ActionStatus.FAILURE,
      message: '账户已存在',
    };
  }

  redirect('/dashboard/user');
}

/**
 * 用户是否存在
 *
 * @param where
 * @returns
 */
export async function existsAction(where: WhereOptions) {
  const result = await UserModel.findOne({ where });
  return result !== null;
}

/** 发送验证码 */
export async function sendCaptchaEmailAction(identifier: string) {
  const code = generate(identifier);

  const result = transporter.sendMail({
    to: identifier,
    subject: '[MIX] 验证码',
    text: `验证码：${code}\n`,
    html: await reactToHtml(<CaptchaEmailBody code={code} />),
  });

  return result;
}
