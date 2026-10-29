/**
 * 后台管理页面布局
 *
 * sobird<i@sobird.me> at 2023/12/04 0:07:22 created.
 */

import { redirect } from 'next/navigation';

import DashboardShell from '@/components/layout/dashboard/shell';
import { getSessionUserId } from '@/services/auth';
import { getMenuForUser } from '@/services/menu';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect('/signin');
  }

  const menu = await getMenuForUser(userId);

  return <DashboardShell menu={menu}>{children}</DashboardShell>;
}
