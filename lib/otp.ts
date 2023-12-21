import { authenticator } from 'otplib';

/** 10分钟内有效 */
export const expire = 10;
authenticator.options = { step: expire * 60 };

// Alternative:
// const secret = authenticator.generateSecret();
// Note: .generateSecret() is only available for authenticator and not totp/hotp

export const generate = (secret: string) => {
  return authenticator.generate(secret);
};

export const verify = (token: string, secret: string) => {
  return authenticator.check(token, secret);
};
