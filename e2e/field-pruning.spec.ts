import { expect, test } from '@playwright/test';

import { signIn } from './auth';
import { E2E_TARGET_USERNAME, E2E_VIEWER } from './fixtures';

test('restricted role sees pruned columns, fields and writes', async ({ page }) => {
  await signIn(page, E2E_VIEWER, '/dashboard/user');

  await expect(page.getByRole('columnheader', { name: '用户名' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '邮箱' })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: '状态' })).toHaveCount(0);

  await page
    .getByRole('row', { name: new RegExp(E2E_TARGET_USERNAME) })
    .getByRole('link', { name: '编辑' })
    .click();
  // 首次进入编辑页需要按需编译，等待导航完成后再断言
  await page.waitForURL(/\/dashboard\/user\/\d+\/edit$/);

  await expect(page.getByLabel('用户名')).toBeVisible();
  await expect(page.getByLabel('用户昵称')).toBeVisible();
  await expect(page.getByLabel('手机号码')).toHaveCount(0);
  await expect(page.getByLabel('角色')).toHaveCount(0);

  await page.getByLabel('用户昵称').fill('改名成功');
  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/user$/);

  await page
    .getByRole('row', { name: new RegExp(E2E_TARGET_USERNAME) })
    .getByRole('link', { name: '编辑' })
    .click();
  await page.waitForURL(/\/dashboard\/user\/\d+\/edit$/);
  await expect(page.getByLabel('用户昵称')).toHaveValue('改名成功');
});
