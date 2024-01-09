import { z } from 'zod';
import { createFormRule } from '.';
import { existsAction } from '@/actions/user';
import { isChineseName, isMobilePhone } from '@/utils/validator';

const usernameZod = z.object({
  id: z.number().optional(),
  username: z.string({
    required_error: '请输入用户名',
  }).regex(/^[a-zA-Z][a-zA-Z0-9_]{1,20}$/, '长度在2~20位之间，包含字母、数字、下划线'),
}).refine(async ({ id, username }) => {
  if (!username) {
    return true;
  }
  return !await existsAction({ username }, id);
}, {
  message: '用户名已存在',
  path: ['username'],
});

const emailZod = z.object({
  id: z.number().optional(),
  email: z.string({
    required_error: '请输入邮箱',
  }).email('邮箱格式不正确'),
}).refine(async ({ id, email }) => {
  if (!email) {
    return true;
  }
  return !await existsAction({ email }, id);
}, {
  message: '邮箱已存在',
  path: ['email'],
});

const passwordZod = z.object({
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

const verificationCodeZod = z.object({
  verificationCode: z.string({
    required_error: '请输入验证码',
  }).regex(/^\d{6}$/, '验证码为6位数字'),
});

const ohtersZod = z.object({
  nickname: z.string().regex(/^[\d\w_\u4E00-\u9FFF]{2,20}$/, '长度在2~20位之间，包含中文、字母、数字、下划线').or(z.literal('')),
  realname: z.string().refine((realname) => {
    return isChineseName(realname);
  }, {
    message: '请输入正确的中文名',
  }).or(z.literal('')),
  mobile: z.string().refine((mobile) => {
    return isMobilePhone(mobile);
  }, {
    message: '请输入正确的手机号',
  }),
});

export const UserZod = ohtersZod.and(usernameZod).and(emailZod);

// 用户注册需要验证码认证
const SignUpWithCaptchaZod = z.intersection(UserZod, verificationCodeZod);
export const SignUpZod = z.intersection(SignUpWithCaptchaZod, passwordZod);
export const UserWithPasswordZod = z.intersection(UserZod, passwordZod);

export type SignUpAttributes = z.infer<typeof SignUpZod>;
export type UserAttributes = z.infer<typeof UserWithPasswordZod>;

// antd form rule
export const SignUpFormRule = createFormRule(SignUpWithCaptchaZod);
export const usernameRule = createFormRule(usernameZod);
export const passwordRule = createFormRule(passwordZod);
export const emailRule = createFormRule(emailZod);
export const verificationCodeRule = createFormRule(verificationCodeZod);
export const UserFormRule = createFormRule(ohtersZod);
