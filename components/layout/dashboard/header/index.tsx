/**
 * LayoutMain Header
 *
 * sobird<i@sobird.me> at 2023/09/06 22:50:28 created.
 */

'use client';

import { Dropdown } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import Logo from '@/assets/mix.svg';

import Search from '../search';
import styles from './index.module.scss';

const items = [
  {
    label: '更换登录手机',
    key: 'iphone',
  },
  {
    label: '退出',
    key: 'logout',
  },
];

const onClick = ({ key }) => {
  switch (key) {
    case 'iphone':
      break;
    case 'logout':

      break;
    default:
      break;
  }
};

const Header: React.FC = () => {
  return (
    <header className={styles.container}>
      <div className={styles.brand}>
        <Link href="/dashboard" title="mix" aria-label="mix">
          <Image src={Logo} width={32} height={32} alt="" />
        </Link>
      </div>

      <div className={styles.bread}>
        {/* <Search /> */}
        <div className={styles.nav}>
          <Dropdown menu={{ items, onClick }} overlayClassName={styles.dropdown}>
            <div className={styles.avatar}>
              <Image src={Logo} width={32} height={32} alt="" />
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default Header;
