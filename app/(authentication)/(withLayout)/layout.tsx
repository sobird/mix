import React, { PropsWithChildren } from 'react';
import Image from 'next/image';
import mix from '@/assets/mix.svg';
import styles from '../signin/verify/page.module.scss';

const AuthLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div>
      <div className={styles.header}>
        <Image className="logo" src={mix.src} width={32} height={32} alt="mix" />
      </div>
      {children}
    </div>
  );
};

export default AuthLayout;
