import { createTransport, type SendMailOptions } from 'nodemailer';

import Authentication from '@/components/email-template/authentication';
import CaptchaEmailBody from '@/components/email-template/captcha';
import reactToHtml from '@/lib/reactToHtml';

// 创建发送邮件的对象
export const transporter = createTransport({
  service: 'qq',
  secure: true,
  // host: process.env.EMAIL_SERVER_HOST,
  // port: process.env.EMAIL_SERVER_PORT,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASS,
  },
}, {
  from: process.env.EMAIL_FROM,
});

export const sendMail = async (mailOptions: SendMailOptions) => {
  const result = await transporter.sendMail(mailOptions);
  const failed = result.rejected.concat(result.pending).filter(Boolean);
  if (failed.length) {
    throw new Error(`Email(s) (${failed.join(', ')}) could not be sent`);
  }
};

/** 发送邮箱登录连接 */
export async function sendVerificationRequest(params) {
  const {
    identifier, url,
  } = params;
  // NOTE: You are not required to use `nodemailer`, use whatever you want.
  sendMail({
    to: identifier,
    subject: '[MIX] 登录验证',
    text: `登录链接 \n${url}\n\n`,
    html: await reactToHtml(<Authentication url={url} />),
  });
}

/** 发送验证码 */
export async function sendCaptcha(identifier: string, code: string) {
  sendMail({
    to: identifier,
    subject: '[MIX] 验证码',
    text: `验证码：${code}\n`,
    html: await reactToHtml(<CaptchaEmailBody code={code} />),
  });
}
