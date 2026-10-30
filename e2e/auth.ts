import type { Page } from '@playwright/test';

export async function signIn(page: Page, user: { username: string; password: string }, callbackUrl: string) {
  await page.goto(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  // 等待客户端脚本完成水合，否则点击会触发原生表单提交
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('用户账号').fill(user.username);
  await page.getByPlaceholder('用户密码').fill(user.password);
  // antd 会在两个汉字之间插入空格，可访问名称为「登 录」
  await page.getByRole('button', { name: /登\s*录/ }).click();
  await page.waitForURL((url) => url.pathname === callbackUrl);
}
