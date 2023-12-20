import { z } from 'zod';
import { zodToRule } from '.';
import { exists } from '@/actions/user';

export const SignUpZod = z.object({
  username: z.string({
    required_error: '请输入用户名',
  }).regex(/^[a-zA-Z][a-zA-Z0-9_]{1,20}$/, '长度在2~20位之间，包含字母、数字、下划线')
    .refine(async (username) => {
      if (!username) {
        return true;
      }
      return !await exists({ username });
    }, {
      message: '用户名已存在',
    }),
  email: z.string({
    required_error: '请输入邮箱',
  }).email('邮箱格式不正确').refine(async (email) => {
    if (!email) {
      return true;
    }
    return !await exists({ email });
  }, {
    message: '邮箱已存在',
  }),
  verificationCode: z.string({
    required_error: '请输入验证码',
  }).regex(/^\d{6}$/, '验证码为6位数字'),
  users: z.array(z.object({
    first: z.string().min(3),
    last: z.string().min(1),
  })).min(2),
  user: z.object({
    name: z.string().min(1),
    email: z.string().email(),
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
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const SignUpZodWithRefine = z.intersection(SignUpZod, PasswordZod);
export type SignUpAttributes = z.infer<typeof SignUpZodWithRefine>;

export const SignUpFormRule = zodToRule(SignUpZod);
export const SignUpPasswordRule = zodToRule(PasswordZod);
