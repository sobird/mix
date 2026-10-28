'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { WhereOptions, Op } from 'sequelize';

import CaptchaEmailBody from '@/components/email-template/captcha';
import { generate, verify } from '@/lib/otp';
import reactToHtml from '@/lib/reactToHtml';
import { UserModel } from '@/models';
import { transporter } from '@/services/mailer';
import {
  signUpZod,
  SignUpAttributes,
  createUserZod,
  UserAttributes,
  updateUserZod,
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
export async function signUpAction(payload: SignUpAttributes): Promise<UserServerActionState> {
  const validated = await signUpZod.safeParseAsync(payload);
  if (!validated.success) {
    return {
      status: ActionStatus.FAILURE,
      errors: validated.error.flatten().fieldErrors,
      message: 'Validation Fields Failed to Sign Up.',
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
  const validated = await createUserZod.safeParseAsync(payload);
  if (!validated.success) {
    return {
      status: ActionStatus.FAILURE,
      errors: validated.error.flatten().fieldErrors,
      message: 'Validation Fields Failed to Sign Up.',
    };
  }
  const { data } = validated;
  const [user, created] = await UserModel.findOrCreate({
    defaults: {
      ...data,
      emailVerified: new Date(),
    },
    where: {
      [Op.or]: [
        { username: data.username },
        { email: data.email },
      ],
    },
  });
  // 已存在
  if (!created) {
    return {
      status: ActionStatus.FAILURE,
      message: '账户已存在',
    };
  }

  user.setRoles(data.roles);
  revalidatePath('/dashboard/user');
  redirect('/dashboard/user');
}

// 更新用户信息
export async function updateUserAction(
  payload: UserAttributes,
): Promise<UserServerActionState> {
  const validated = await updateUserZod.safeParseAsync(payload);

  if (!validated.success) {
    return {
      status: ActionStatus.FAILURE,
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update User.',
    };
  }

  try {
    const { data } = validated;
    const user = await UserModel.findOne({
      where: {
        id: payload.id,
      },
    });

    user?.update(data);
    user?.setRoles(data.roles);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return {
        status: ActionStatus.FAILURE,
        message: '用户已存在',
      };
    }
  }

  revalidatePath('/dashboard/user');
  redirect('/dashboard/user');
}

export async function deleteUserAction(id: string) {
  const user = await UserModel.destroy({
    where: {
      id,
    },
  });
  revalidatePath('/dashboard/user');
  return user;
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

export async function verifyVerificationCode(payload: { verificationCode: string, email: string }) {
  return verify(payload.verificationCode, payload.email);
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
