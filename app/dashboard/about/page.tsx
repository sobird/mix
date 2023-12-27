'use client';

import { Button } from 'antd';
import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateUser } from '@/store/slices/app';

const AboutPage = () => {
  const appState = useAppSelector((state) => { return state.app; });
  console.log('appState', appState);

  const dispatch = useAppDispatch();

  return (
    <div>
      <h3>AboutPage</h3>
      <Button onClick={() => {
        dispatch(updateUser({
          name: 'test',
        }));
      }}
      >
        Dispatch
      </Button>

      <form>
        <input name="username" />
        <button type="submit">submit</button>
      </form>
    </div>
  );
};

export default AboutPage;
