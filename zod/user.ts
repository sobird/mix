import { ZodEffects, z } from 'zod';
import { createSchemaFieldRule } from 'antd-zod';
import { zodToRule } from '.';
import { exists } from '@/actions/user';

export const SignUpZod = z
  .object({
    username: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{1,20}$/, '长度在2~20位之间，包含字母、数字、下划线')
      .refine(async (username) => {
        if (!username) {
          return true;
        }
        return !await exists({ username });
      }, {
        message: '用户名已存在',
      }),
    email: z.string().min(1).email(),
    verificationCode: z.string().regex(/^\d{6}$/, '验证码为6位数字'),
    users: z.array(z.object({
      first: z.string().min(3),
      last: z.string().min(1),
    })).min(2),
    user: z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }),
  });

export const PasswordZod = z
  .object({
    password: z.string().regex(/^(?![0-9]+)(?![a−zA−Z]+)[0-9A-Za-z]{6,20}$/, '长度在6~20位之间，必须包含字母、数字，不能全是数字'),
    confirmPassword: z.string(),
  })
  .refine((data) => { return data.password === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const SignUpZodWithRefine = z.intersection(SignUpZod, PasswordZod);

export type SignUpAttributes = z.infer<typeof SignUpZodWithRefine>;

export const SignUpFormRule = zodToRule(SignUpZod);
export const SignUpPasswordRule = zodToRule(PasswordZod, ['password']);
export const SignUpFormRule2 = createSchemaFieldRule(SignUpZod);
