import Image from 'next/image';
import Link from 'next/link';
import React, { PropsWithChildren } from 'react';

import mix from '@/assets/mix.svg';

import styles from './layout.module.scss';

const AuthLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className={styles.auth}>
      <div className={styles.header}>
        <Link href="/">
          <Image className="logo" src={mix.src} width={32} height={32} alt="mix" />
        </Link>
      </div>
      {children}
    </div>
  );
};

export default AuthLayout;
