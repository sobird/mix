import { z } from 'zod';
import { createFormRule } from '.';
import { existsAction } from '@/actions/user';

export const UserZod = z.object({
  username: z.string({
    required_error: '请输入用户名',
  }).regex(/^[a-zA-Z][a-zA-Z0-9_]{1,20}$/, '长度在2~20位之间，包含字母、数字、下划线')
    .refine(async (username) => {
      if (!username) {
        return true;
      }
      return !await existsAction({ username });
    }, {
      message: '用户名已存在',
    }),
  email: z.string({
    required_error: '请输入邮箱',
  }).email('邮箱格式不正确').refine(async (email) => {
    if (!email) {
      return true;
    }
    return !await existsAction({ email });
  }, {
    message: '邮箱已存在',
  }),
});

export const PasswordZod = z.object({
  password: z.string({
    required_error: '请输入密码',
  }).regex(/^(?![0-9]+)(?![a−zA−Z]+)[0-9A-Za-z]{6,20}$/, '长度在6~20位之间，必须包含字母、数字，不能全是数字'),
  confirmPassword: z.string({
    required_error: '请输入确认密码',
  }),
}).refine((data) => { return data.password === data.confirmPassword; }, {
  message: '两次密码不一致',
  path: ['confirmPassword'],
});

export const VerificationCodeZod = z.object({
  verificationCode: z.string({
    required_error: '请输入验证码',
  }).regex(/^\d{6}$/, '验证码为6位数字'),
});

export const SignUpZod = z.intersection(UserZod, VerificationCodeZod);
export const SignUpZodWithRefine = z.intersection(SignUpZod, PasswordZod);
export const CreateUserZodWithRefine = z.intersection(UserZod, PasswordZod);

export type SignUpAttributes = z.infer<typeof SignUpZodWithRefine>;
export type CreateUserAttributes = z.infer<typeof CreateUserZodWithRefine>;

export const SignUpFormRule = createFormRule(SignUpZod);
export const UserPasswordRule = createFormRule(PasswordZod);
export const CreateUserFormRule = createFormRule(UserZod);
