import { createHash } from 'node:crypto';

import { generateSync, ScureBase32Plugin, verifySync } from 'otplib';

/** 10分钟内有效 */
export const expire = 10;
const period = expire * 60;

const base32 = new ScureBase32Plugin();

/** 将任意标识转换为 otplib 要求的 base32 secret */
const toSecret = (identifier: string) => base32.encode(createHash('sha256').update(identifier).digest());

export const generate = (identifier: string) => {
  return generateSync({ secret: toSecret(identifier), period });
};

export const verify = (token: string, identifier: string) => {
  try {
    return verifySync({ secret: toSecret(identifier), token, period }).valid;
  } catch {
    return false;
  }
};
