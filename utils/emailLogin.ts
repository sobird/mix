/**
 * 根据Email获取登录地址
 *
 * sobird<i@sobird.me> at 2023/11/30 17:07:42 created.
 */

export const EMAIL_LOGIN_MAP = {
  'qq.com': 'https://mail.qq.com',
  'gmail.com': 'https://mail.google.com',
  'sina.com': 'https://mail.sina.com.cn',
  '163.com': 'https://mail.163.com',
  '126.com': 'https://mail.126.com',
  'yeah.net': 'https://www.yeah.net/',
  'sohu.com': 'https://mail.sohu.com/',
  'tom.com': 'https://mail.tom.com/',
  'sogou.com': 'https://mail.sohu.com/',
  '139.com': 'https://mail.10086.cn/',
  'hotmail.com': 'https://www.hotmail.com',
  'live.com': 'https://login.live.com/',
  'live.cn': 'https://login.live.cn/',
  'live.com.cn': 'https://login.live.com.cn',
  '189.com': 'https://mail.189.cn/',
  'yahoo.com': 'https://mail.yahoo.com/',
  'yahoo.cn': 'https://mail.yahoo.cn/',
  'eyou.com': 'http://eyou.com/',
  '21cn.com': 'https://mail.21cn.com/',
  '188.com': 'https://www.188.com/',
  'foxmail.com': 'https://www.foxmail.com',
  'outlook.com': 'https://www.outlook.com',
};

export const getEmailLoginUrl = (email: string) => {
  const emailSuffix = email.split('@')[1];
  return EMAIL_LOGIN_MAP[emailSuffix];
};
