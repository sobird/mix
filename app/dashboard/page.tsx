'use client';

import { useRef } from 'react';
import { Button } from 'antd';
import { useAppSelector, useAppDispatch, useAppStore } from '@/store';
import {
  updateUser, updateMicro, toggleAside,
} from '@/store/slices/app';

const DashBoard = () => {
  // Initialize the store with the product information
  const store = useAppStore();
  const initialized = useRef(false);
  if (!initialized.current) {
    // store.dispatch(initializeProduct(product));
    initialized.current = true;
  }

  const dispatch = useAppDispatch();

  return (
    <div>
      DashBoardPage
      <Button onClick={() => {
        return dispatch(toggleAside());
      }}
      >
        dispatch

      </Button>
    </div>
  );
};

export default DashBoard;
