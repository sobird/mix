import { z } from 'zod';

import { existsAction, verifyVerificationCode } from '@/actions/user';
import { analyzePassword, isChineseName, isMobilePhone } from '@/utils/validator';

import { createFormRule } from '.';

const usernameZod = z
  .object({
    id: z.number().optional(),
    username: z
      .string({
        required_error: '请输入用户名',
      })
      .regex(/^[a-zA-Z][a-zA-Z0-9_]{1,20}$/, '长度在2~20位之间，包含字母、数字、下划线'),
  })
  .refine(
    async ({ id, username }) => {
      if (!username) {
        return true;
      }
      return !(await existsAction({ username }, id));
    },
    {
      message: '用户名已存在',
      path: ['username'],
    },
  );

const emailZod = z
  .object({
    id: z.number().optional(),
    email: z
      .string({
        required_error: '请输入邮箱',
      })
      .email('邮箱格式不正确'),
  })
  .refine(
    async ({ id, email }) => {
      if (!email) {
        return true;
      }
      return !(await existsAction({ email }, id));
    },
    {
      message: '邮箱已存在',
      path: ['email'],
    },
  );

const passwordZod = z
  .object({
    password: z
      .string({
        required_error: '请输入密码',
      })
      .superRefine((password, ctx) => {
        const analysis = analyzePassword(password);

        if (
          analysis.uppercaseCount < 1
          || analysis.lowercaseCount < 1
          || analysis.numberCount < 1
          || analysis.symbolCount < 1
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '密码必须包含大小写字母、数字及特殊字符',
          });
        }
        if (analysis.length < 8 || analysis.length > 16) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '密码长度必须在8-16位字符之间',
          });
        }
      }),
    confirmPassword: z.string({
      required_error: '请输入确认密码',
    }),
  })
  .refine(
    (data) => {
      return data.password === data.confirmPassword;
    },
    {
      message: '两次密码不一致',
      path: ['confirmPassword'],
    },
  );

const verificationCodeZod = z.object({
  email: z.string(),
  verificationCode: z
    .string({
      required_error: '请输入验证码',
    })
    .regex(/^\d{6}$/, '验证码为6位数字'),
}).refine(
  async (payload) => {
    return verifyVerificationCode(payload);
  },
  {
    message: '验证码错误',
    path: ['verificationCode'],
  },
);

// 通用字段校验
const ohtersZod = z.object({
  nickname: z
    .string()
    .regex(/^[\d\w_\u4E00-\u9FFF]{2,20}$/, '长度在2~20位之间，包含中文、字母、数字、下划线')
    .optional()
    .or(z.literal('')),
  realname: z
    .string()
    .refine(
      (realname) => {
        return isChineseName(realname);
      },
      {
        message: '请输入正确的中文名',
      },
    )
    .optional()
    .or(z.literal('')),
  mobile: z
    .string()
    .refine(
      (mobile) => {
        return isMobilePhone(mobile);
      },
      {
        message: '请输入正确的手机号',
      },
    )
    .optional()
    .or(z.literal('')),
  gender: z.enum(['male', 'female', 'unknown']).optional().or(z.literal('')),
  roles: z.array(z.number()).optional(),
  status: z.boolean({
    required_error: '状态未选择',
  }),
});

// 前台注册
export const signUpZod = usernameZod.and(passwordZod).and(verificationCodeZod).and(emailZod);
export const updateUserZod = ohtersZod.and(usernameZod).and(emailZod);
export const createUserZod = z.intersection(updateUserZod, passwordZod);

export type SignUpAttributes = z.infer<typeof signUpZod>;
export type UserAttributes = z.infer<typeof createUserZod>;

// antd form rule
export const usernameRule = createFormRule(usernameZod);
export const passwordRule = createFormRule(passwordZod);
export const emailRule = createFormRule(emailZod);
export const verificationCodeRule = createFormRule(verificationCodeZod);
export const userFormRule = createFormRule(ohtersZod);
