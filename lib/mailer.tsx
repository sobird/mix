import { createTransport } from 'nodemailer';
import reactToHtml from '@/lib/reactToHtml';
import Verification from '@/components/email-template/verification';

export async function sendVerificationRequest(params) {
  const {
    identifier, url, provider,
  } = params;
  const { host } = new URL(url);
  // NOTE: You are not required to use `nodemailer`, use whatever you want.
  const transport = createTransport(provider.server);
  const result = await transport.sendMail({
    to: identifier,
    from: provider.from,
    subject: '[MIX] 登录验证',
    text: `登录 ${host}\n${url}\n\n`,
    html: await reactToHtml(<Verification url={url} host={host} />),
  });
  const failed = result.rejected.concat(result.pending).filter(Boolean);
  if (failed.length) {
    throw new Error(`Email(s) (${failed.join(', ')}) could not be sent`);
  }
}
