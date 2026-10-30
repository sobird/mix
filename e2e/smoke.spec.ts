import { expect, test } from '@playwright/test';

import { E2E_OWNER } from './fixtures';

test('owner can sign in and see the user list', async ({ page }) => {
  await page.goto('/signin?callbackUrl=/dashboard/user');
  // 等待客户端脚本完成水合，否则点击会触发原生表单提交
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('用户账号').fill(E2E_OWNER.username);
  await page.getByPlaceholder('用户密码').fill(E2E_OWNER.password);
  // antd 会在两个汉字之间插入空格，可访问名称为「登 录」
  await page.getByRole('button', { name: /登\s*录/ }).click();

  // 首次访问 /dashboard/user 需要按需编译，给导航与渲染留出时间
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:3100\/dashboard\/user(?:\?|$)/, { timeout: 30_000 });
  await expect(page.getByRole('button', { name: '创建用户' })).toBeVisible({ timeout: 30_000 });
});
