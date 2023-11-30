/**
 * 核对校验工具 一般用户表单的校验
 * 
 * @see https://github.com/validatorjs/validator.js
 * @see https://github.com/yiminghe/async-validator
 * sobird<i@sobird.me> at 2023/06/14 23:51:02 created.
 */

export const patterns = {
  86: /^((\+|00)86)?(1[3-9]|9[28])\d{9}$/,
  65: /^(\+65)?[3689]\d{7}$/,
  852: /^(\+?852[-\s]?)?[456789]\d{3}[-\s]?\d{4}$/,
  853: /^(\+?853[-\s]?)?[6]\d{3}[-\s]?\d{4}$/,
  886: /^(\+?886\-?|0)?9\d{8}$/,
};

export default function isMobilePhone(str: string, code: 86 | 65 | 852 | 853 | 886 | string = 86) {
  return patterns[code].test(str);
}
