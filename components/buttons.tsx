'use client';

import { signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from 'antd';

export const LoginButton = () => {
  return (
    <Button type="primary" style={{ marginRight: 10 }} onClick={() => { return signIn(); }}>
      Sign in
    </Button>
  );
};

export const RegisterButton = () => {
  return (
    <Button type="link" href="/register" style={{ marginRight: 10 }}>
      Register
    </Button>
  );
};

export const LogoutButton = () => {
  return (
    <Button type="default" style={{ marginRight: 10 }} onClick={() => { return signOut(); }}>
      Sign Out
    </Button>
  );
};

export const ProfileButton = () => {
  return <Button type="link" href="/profile">Profile</Button>;
};
