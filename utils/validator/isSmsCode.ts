/**
 * 是否为手机短信验证码 一般为6位数字
 * 
 * sobird<i@sobird.me> at 2023/06/15 0:20:58 created.
 */

export const pattern = /^\d{6}$/;

export default function isSmsCode(code: string) {
  return pattern.test(code);
}
