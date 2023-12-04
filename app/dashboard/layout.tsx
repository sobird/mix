/**
 * 后台管理页面布局
 *
 * sobird<i@sobird.me> at 2023/12/04 0:07:22 created.
 */

import { Metadata } from 'next';
import { Button } from 'antd';
import styles from './layout.module.scss';
import StoreProvider from '@/store/provider';
import Header from '@/components/layout/dashboard/header';

export const metadata: Metadata = {
  title: 'mix',
  // description: '',
};

export default function DashboardLayout({ children }: {
  children: React.ReactNode
}) {
  return (
    <StoreProvider>
      <div className={styles.dashboard}>
        <Header />
        <Button>按钮测试</Button>
        {children}
      </div>
    </StoreProvider>
  );
}
