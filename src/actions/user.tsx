'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { WhereOptions, Op } from 'sequelize';

import CaptchaEmailBody from '@/components/email-template/captcha';
import { generate, verify } from '@/lib/otp';
import reactToHtml from '@/lib/reactToHtml';
import { User } from '@/models';
import { getCurrentAbility, isAllowed } from '@/services/ability';
import { transporter } from '@/services/mailer';
import RoleService from '@/services/role';
import { signUpZod, SignUpAttributes, createUserZod, UserAttributes, updateUserZod } from '@/zod/user';

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

  // `signUp` 在 raw 模式下返回数组而非元组，这里显式标注以拿到用户实例
  const [user, created] = (await User.signUp(payload, ['username', 'password', 'email', 'emailVerified', 'salt'])) as [
    User,
    boolean,
  ];
  // 已存在
  if (!created) {
    return {
      status: ActionStatus.FAILURE,
      message: '账户已存在',
    };
  }

  await RoleService.assignDefaultRole(user.id);

  redirect('/signup/success');
}

export async function createUserAction(payload: UserAttributes): Promise<UserServerActionState> {
  const ability = await getCurrentAbility();

  if (!isAllowed(ability, 'create', 'User')) {
    return {
      status: ActionStatus.FAILURE,
      message: '您没有创建用户的权限',
    };
  }

  const validated = await createUserZod.safeParseAsync(payload);
  if (!validated.success) {
    return {
      status: ActionStatus.FAILURE,
      errors: validated.error.flatten().fieldErrors,
      message: 'Validation Fields Failed to Sign Up.',
    };
  }
  const { data } = validated;
  const [user, created] = await User.findOrCreate({
    defaults: {
      ...data,
      emailVerified: new Date(),
    },
    where: {
      [Op.or]: [{ username: data.username }, { email: data.email }],
    },
  });
  // 已存在
  if (!created) {
    return {
      status: ActionStatus.FAILURE,
      message: '账户已存在',
    };
  }

  await RoleService.assignDefaultRole(user.id);
  if (data.roles?.length) {
    await user.setRoles(data.roles);
  }

  revalidatePath('/dashboard/user');
  redirect('/dashboard/user');
}

// 更新用户信息
export async function updateUserAction(payload: UserAttributes): Promise<UserServerActionState> {
  const ability = await getCurrentAbility();
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
    const target = await User.findByPk(payload.id);

    if (!target) {
      return {
        status: ActionStatus.FAILURE,
        message: '用户不存在',
      };
    }

    if (!isAllowed(ability, 'update', 'User', target)) {
      return {
        status: ActionStatus.FAILURE,
        message: '您没有更新用户的权限',
      };
    }

    await target.update(data);
    if (data.roles?.length) {
      await target.setRoles(data.roles);
    }
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
  const ability = await getCurrentAbility();
  const user = await User.findByPk(id);

  if (!user) {
    return {
      status: ActionStatus.FAILURE,
      message: '用户不存在',
    };
  }

  if (!isAllowed(ability, 'delete', 'User', user)) {
    return {
      status: ActionStatus.FAILURE,
      message: '您没有删除用户的权限',
    };
  }

  const destroyed = await User.destroy({
    where: {
      id,
    },
  });
  revalidatePath('/dashboard/user');
  return destroyed;
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
  const result = await User.findOne({ where });
  return result !== null;
}

export async function verifyVerificationCode(payload: { verificationCode: string; email: string }) {
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
