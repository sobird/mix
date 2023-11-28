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
    <Link type="link" href="/signup" style={{ marginRight: 10 }}>
      Sign up
    </Link>
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
  return <Link type="link" href="/profile">Profile</Link>;
};
