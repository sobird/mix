/**
 * createMany is not supported for SQLite.
 *
 * @todo ActionResult
 *
 * sobird<i@sobird.me> at 2023/12/21 1:41:10 created.
 */

'use server';

import prisma from '@/lib/prisma';
import { SignUpZodWithRefine, SignUpAttributes } from '@/zod/user';

import { transporter } from '@/lib/mailer';
import reactToHtml from '@/lib/reactToHtml';
import CaptchaEmailBody from '@/components/email-template/captcha';
import { generate, verify } from '@/lib/otp';

export async function signup(prevState, payload: SignUpAttributes) {
  const validatedFields = await SignUpZodWithRefine.safeParseAsync(payload);
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Sign Up.',
    };
  }

  // 验证码是否有效
  const isValid = verify(payload.verificationCode, payload.email);

  // if (!isValid) {
  //   return {
  //     success: false,
  //     message: '验证码无效',
  //   };
  // }

  const res = await prisma.user.create({
    data: {
      username: payload.username,
      email: payload.email,
      password: payload.email,
    },
  });
  return res;
}

/** 发送验证码 */
export async function sendCaptchaEmail(identifier: string) {
  const code = generate(identifier);

  const result = transporter.sendMail({
    to: identifier,
    subject: '[MIX] 验证码',
    text: `验证码：${code}\n`,
    html: await reactToHtml(<CaptchaEmailBody code={code} />),
  });

  return result;
}
