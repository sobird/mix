/**
 * 邮箱格式校验
 * 
 * sobird<i@sobird.me> at 2023/10/28 0:40:59 created.
 */

const reg = /^[0-9a-zA-Z_.-]+[@][0-9a-zA-Z_.-]+([.][a-zA-Z]+){1,2}$/;

export default function isEmail(email: string) {
  if(email?.trim().length > 320) {
    return false;
  }
  return reg.test(email);
}
