/**
 * 后台管理布局壳
 *
 * 接收服务端组件下发的菜单数据，渲染 Header、Aside 与主内容区。
 */

'use client';

import classNames from 'classnames';
import type { ReactNode } from 'react';

import type { MenuView } from '@/services/menu';
import { useAppSelector } from '@/store';

import Aside from './aside';
import Header from './header';

import styles from '../../../app/dashboard/layout.module.scss';

interface DashboardShellProps {
  menu: MenuView;
  children: ReactNode;
}

const DashboardShell: React.FC<DashboardShellProps> = ({ menu, children }) => {
  const { collapsed } = useAppSelector((state) => {
    return state.app;
  });

  return (
    <div
      className={classNames(styles.container, {
        [styles.collapsed]: collapsed,
      })}
    >
      <Header />
      <div className={classNames(styles.body, 'layout-body')}>
        <Aside menu={menu} collapsed={collapsed} />
        <main className={styles.main}>
          <div id="micro-container" style={{ width: '100%' }} />
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
