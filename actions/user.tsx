'use server';

import { redirect } from 'next/navigation';
import { WhereOptions, Op } from 'sequelize';

import { revalidatePath } from 'next/cache';
import { UserModel } from '@/models';
import { generate, verify } from '@/lib/otp';
import { transporter } from '@/lib/mailer';
import reactToHtml from '@/lib/reactToHtml';
import CaptchaEmailBody from '@/components/email-template/captcha';
import {
  SignUpZod, SignUpAttributes, UserWithPasswordZod, UserAttributes, UserZod,
} from '@/zod/user';
import { ActionStatus } from '.';

type UserServerActionState = ServerActionState<SignUpAttributes>;

/**
 * 注册用户
 *
 * @param prevState
 * @param payload
 * @returns
 */
export async function signUpAction(
  payload: SignUpAttributes,
): Promise<UserServerActionState> {
  const validatedFields = await SignUpZod.safeParseAsync(payload);
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

  const [, created] = await UserModel.signUp(payload, ['username', 'password', 'email', 'emailVerified', 'salt']);
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
  payload: UserAttributes,
): Promise<UserServerActionState> {
  const validatedFields = await UserWithPasswordZod.safeParseAsync(payload);
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

// 更新用户信息
export async function updateUserAction(
  payload: UserAttributes,
): Promise<UserServerActionState> {
  const validated = UserZod.safeParse(payload);

  if (!validated.success) {
    return {
      status: ActionStatus.FAILURE,
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Role.',
    };
  }

  try {
    await UserModel.update(validated.data, {
      where: {
        id: payload.id,
      },
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return {
        status: ActionStatus.FAILURE,
        message: '用户已存在',
      };
    }
  }

  revalidatePath('/dashboard/role');
  redirect('/dashboard/role');
}

/**
 * 用户是否存在
 *
 * @param where
 * @returns
 */
export async function existsAction(InternalWhere: WhereOptions, id?: number) {
  let where = InternalWhere;
  if (id) {
    where = {
      ...InternalWhere,
      id: {
        [Op.ne]: id,
      },
    };
  }
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
