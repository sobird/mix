/**
 * 后台管理页面布局
 *
 * sobird<i@sobird.me> at 2023/12/04 0:07:22 created.
 */

'use client';

import classNames from 'classnames';
import Link from 'next/link';
import Header from '@/components/layout/dashboard/header';
import Aside from '@/components/layout/dashboard/aside';
import styles from './layout.module.scss';
import { useAppSelector } from '@/store';

export default function DashboardLayout({ children }: {
  children: React.ReactNode
}) {
  const { collapsed } = useAppSelector((state) => { return state.app; });

  return (
    <div
      className={classNames(styles.container, {
        test: collapsed,
      })}
    >
      <Header />
      <div className={styles.body}>
        <Aside />
        <main className={styles.main}>
          <Link href="/dashboard">首页</Link>
          <Link href="/dashboard/about">关于</Link>
          <div id="micro-container" style={{ width: '100%' }} />
          {children}
        </main>
      </div>

    </div>
  );
}
