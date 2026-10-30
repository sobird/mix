import { expect, test } from '@playwright/test';

import { signIn } from './auth';
import { E2E_OWNER, E2E_RESTRICTED_ROLE } from './fixtures';

test('restrictions survive a save and reload', async ({ page }) => {
  await signIn(page, E2E_OWNER, '/dashboard/role');
  await page
    .getByRole('row', { name: new RegExp(E2E_RESTRICTED_ROLE) })
    .getByRole('link', { name: '编辑' })
    .click();
  await page.waitForURL(/\/dashboard\/role\/\d+\/edit$/);

  await page.getByLabel('Role:read').check();
  await page.getByLabel('限制:Role').click();
  await page.getByLabel('字段限制').click();
  // antd 6 把 role=option 放在隐藏的无障碍列表里，需点击可见的下拉项
  await page.locator('.mix-select-dropdown').getByText('备注', { exact: true }).click();
  // 第一次 Escape 收起下拉，第二次关闭抽屉
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /保\s*存/ }).click();

  await expect(page.getByText('权限已保存')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Role:read')).toBeChecked();
  await expect(page.getByLabel('限制:Role')).toBeEnabled();
});

test('built-in roles are read-only', async ({ page }) => {
  await signIn(page, E2E_OWNER, '/dashboard/role');
  await page
    .getByRole('row', { name: /拥有者/ })
    .getByRole('link', { name: '编辑' })
    .click();
  await page.waitForURL(/\/dashboard\/role\/\d+\/edit$/);

  await expect(page.getByText('内置角色权限由权限目录同步维护')).toBeVisible();
  await expect(page.getByLabel('all:manage')).toBeDisabled();
});
