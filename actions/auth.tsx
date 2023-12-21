/**
 *
 * @todo ActionResult
 *
 * sobird<i@sobird.me> at 2023/12/21 1:41:10 created.
 */

'use server';

import { transporter } from '@/lib/mailer';
import reactToHtml from '@/lib/reactToHtml';
import CaptchaEmailBody from '@/components/email-template/captcha';
import { generate, verify } from '@/lib/otp';

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
